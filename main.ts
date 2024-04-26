import PCA from 'pca';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { VectorDatabase } from 'vector';
import { matrix, transpose } from 'mathjs';
import { EMBEDDING_VIEW_TYPE, EmbeddingView } from 'embeddingView';
import {
    App,
    PluginSettingTab,
    Setting,
    Plugin,
    TFile,
    WorkspaceLeaf,
    FileSystemAdapter,
} from 'obsidian';

interface PluginSettings {
    OPENAI_API_KEY: string;
    EMBEDDING_MODEL: string;
    EMBEDDING_URL: string;
    EMBEDDING_REQUEST_HEADER: {
        'Content-Type': string;
        Authorization: string;
    };
    AUTO_REFRESH: boolean;
    VECTORDATABASE_PATH: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
    OPENAI_API_KEY: '',
    EMBEDDING_MODEL: 'text-embedding-3-small',
    EMBEDDING_URL: 'https://api.openai.com/v1/embeddings',
    EMBEDDING_REQUEST_HEADER: {
        'Content-Type': 'application/json',
        Authorization: `Bearer no-key`,
    },
    AUTO_REFRESH: false,
    VECTORDATABASE_PATH: 'vectors.json',
};

export default class MyPlugin extends Plugin {
    settings: PluginSettings;
    basePath: string;
    lastIndexUpdate: number;
    vectorDatabase: VectorDatabase;

    async onload() {
        const adapter = this.app.vault.adapter;
        if (adapter instanceof FileSystemAdapter) {
            this.basePath = adapter.getBasePath();
        } else {
            this.basePath = '';
        }

        await this.loadSettings();

        await this.initVectorDatabase();

        this.registerView(
            EMBEDDING_VIEW_TYPE,
            (leaf) => new EmbeddingView(leaf),
        );

        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                if (this.settings.AUTO_REFRESH) {
                    this.embedAndUpload([file.path]);
                    this.runPCA();
                }
            }),
        );

        this.addCommand({
            id: 'index-documents',
            name: 'Index updated documents',
            callback: () => {
                const currentTime = Date.now();
                const modifiedFiles = this.app.vault
                    .getMarkdownFiles()
                    .filter((file) => file.stat.mtime > this.lastIndexUpdate)
                    .map((file) => file.path);
                if (modifiedFiles.length) {
                    this.embedAndUpload(modifiedFiles);
                    this.lastIndexUpdate = currentTime;
                }
            },
        });

        this.addRibbonIcon('brain-circuit', 'Open embedding view', () => {
            this.activateView();
        });

        this.addSettingTab(new SettingTab(this.app, this));
    }

    async onunload() {
        await this.saveSettings();
        this.vectorDatabase.saveToFile();
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(EMBEDDING_VIEW_TYPE);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getLeaf(false) as WorkspaceLeaf;
            await leaf.setViewState({
                type: EMBEDDING_VIEW_TYPE,
                active: true,
            });
        }

        workspace.revealLeaf(leaf);
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );

        if (
            this.lastIndexUpdate === undefined &&
            !fs.existsSync(this.settings.VECTORDATABASE_PATH)
        ) {
            this.lastIndexUpdate = 0;
        }

        if (fs.existsSync(this.settings.VECTORDATABASE_PATH)) {
            this.lastIndexUpdate = Date.now();
        }
    }

    private async _init_llama() {
        const llamaPath = path.join(
            this.basePath,
            '.obsidian',
            'plugins',
            'obsidian-embedding',
            'llama2',
        );
        const serverArgs = [
            '-m',
            path.join(llamaPath, 'ggml-model-Q4_K_M.gguf'),
            '--embedding',
        ];
        switch (process.platform) {
            case 'win32':
                spawn(path.join(llamaPath, 'windows-server.exe'), serverArgs);
                break;
            case 'linux':
                spawn(path.join(llamaPath, 'linux-server'), serverArgs);
                break;
            default:
                throw new Error(
                    `Platform is not currently supported, only 'win32' and 'linux' supported: ${process.platform}`,
                );
        }
    }

    async loadModel(): Promise<void> {
        switch (this.settings.EMBEDDING_MODEL) {
            case 'text-embedding-3-large' || 'text-embedding-3-small':
                this.settings.EMBEDDING_URL =
                    'https://api.openai.com/v1/embeddings';
                this.settings.EMBEDDING_REQUEST_HEADER = {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.settings.OPENAI_API_KEY}`,
                };

                if (!this.settings.OPENAI_API_KEY) {
                    // TODO: add popup that says to add API Key to use model
                }
                break;
            case 'llama-2-7b':
                this.settings.EMBEDDING_URL =
                    'http://localhost:8080/v1/embeddings';
                this.settings.EMBEDDING_REQUEST_HEADER = {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer no-key',
                };
                await this._init_llama();
                break;
        }
    }

    async runPCA(): Promise<void> {
        const ids = this.vectorDatabase.ids();
        const fullEmbeddings = this.vectorDatabase.fullEmbeddings();
        const eigenvectors = PCA.getEigenVectors(
            transpose(matrix(fullEmbeddings)),
        ).toArray() as number[][];

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const reducedEmbedding = eigenvectors[i];

            this.vectorDatabase.update(id, {
                reducedEmbedding,
            });
        }
    }

    async initVectorDatabase() {
        await this.loadModel();

        this.vectorDatabase = new VectorDatabase(
            path.join(
                this.basePath,
                this.manifest.dir as string,
                this.settings.VECTORDATABASE_PATH,
            ),
        );
        if (fs.existsSync(this.settings.VECTORDATABASE_PATH)) {
            this.vectorDatabase.loadFromFile();
        }

        const allFiles = this.app.vault
            .getMarkdownFiles()
            .map((file) => file.path);
        const filesToEmbed = allFiles.filter(
            (filePath) => !this.vectorDatabase.has(filePath),
        );
        if (filesToEmbed.length > 0) {
            await this.embedAndUpload(filesToEmbed);
        }
        await this.runPCA();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    public async embedText(text: string[]): Promise<any> {
        const response = await fetch(this.settings.EMBEDDING_URL, {
            method: 'POST',
            headers: this.settings.EMBEDDING_REQUEST_HEADER,
            body: JSON.stringify({
                input: text,
                model: this.settings.EMBEDDING_MODEL,
            }),
        });

        if (response.status !== 200) {
            throw new Error(`Request failed: ${response.body}`);
        }

        const embeddingResponse = await response.json();
        return embeddingResponse;
    }

    public async embedDocuments(filePaths: string[]): Promise<any> {
        const documents = [];
        try {
            for (const filePath of filePaths) {
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof TFile) {
                    const document = await this.app.vault.read(file);
                    if (!document) {
                        throw new Error('Document did not contain any text');
                    }
                    documents.push(document);
                } else {
                    throw new Error(
                        'File path does not point to a valid file.',
                    );
                }
            }
        } catch (error) {
            console.error('Error reading file:', error);
        }

        if (documents.length === 0) {
            throw new Error('No valid documents found');
        }

        const embeddingResponse = await this.embedText(documents);
        return embeddingResponse;
    }

    private async embedAndUpload(filePaths: string[]): Promise<void> {
        const embeddingResponse = await this.embedDocuments(filePaths);
        if (embeddingResponse.data) {
            for (let i = 0; i < embeddingResponse.data.length; i++) {
                const fullEmbedding = embeddingResponse.data[i].embedding;
                const vector = {
                    id: filePaths[i],
                    fullEmbedding,
                    reducedEmbedding: fullEmbedding.slice(0, 2),
                };
                if (this.vectorDatabase.has(filePaths[i])) {
                    this.vectorDatabase.update(filePaths[i], {
                        fullEmbedding,
                        reducedEmbedding: fullEmbedding.slice(0, 2),
                    });
                } else {
                    this.vectorDatabase.add(vector);
                }
            }
        } else {
            throw new Error('No embeddings found in the response');
        }
    }
}

class SettingTab extends PluginSettingTab {
    plugin: MyPlugin;
    apiKeyLoaded: boolean;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.apiKeyLoaded = plugin.settings.OPENAI_API_KEY != '' ?? false;
    }

    private obfuscateKey(apiKey: string) {
        return apiKey.slice(0, 3) + '***' + apiKey.slice(-3);
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('OpenAI API Key to be used for embedding')
            .addText((text) =>
                text
                    .setPlaceholder(
                        this.apiKeyLoaded
                            ? this.obfuscateKey(
                                  this.plugin.settings.OPENAI_API_KEY,
                              )
                            : 'Paste API Key Here',
                    )
                    .setValue(
                        this.apiKeyLoaded
                            ? this.obfuscateKey(
                                  this.plugin.settings.OPENAI_API_KEY,
                              )
                            : '',
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.OPENAI_API_KEY = value;
                        if (!this.apiKeyLoaded) {
                            this.apiKeyLoaded = true;
                            this.display();
                        } else {
                            await this.plugin.saveSettings();
                        }
                    }),
            );

        new Setting(containerEl)
            .setName('Embedding Model')
            .setDesc('Select Embedding Model')
            .addDropdown((dropdown) =>
                dropdown
                    .addOption(
                        'text-embedding-3-large',
                        'OpenAI: text-embedding-3-large',
                    )
                    .addOption(
                        'text-embedding-3-small',
                        'OpenAI: text-embedding-3-small',
                    )
                    .addOption(
                        'llama-2-7b',
                        'Local: llama-2-7b 4-bit quantized',
                    )
                    .setValue(this.plugin.settings.EMBEDDING_MODEL)
                    .onChange(async (value) => {
                        if (value !== this.plugin.settings.EMBEDDING_MODEL) {
                            // When model changes reset vector database and clear vector file store if it exists
                            this.plugin.vectorDatabase = new VectorDatabase(
                                path.join(
                                    this.plugin.basePath,
                                    this.plugin.manifest.dir as string,
                                    this.plugin.settings.VECTORDATABASE_PATH,
                                ),
                            );
                            this.plugin.settings.EMBEDDING_MODEL = value;
                            await this.plugin.loadModel();
                            await this.plugin.saveSettings();
                        }
                    }),
            );

        new Setting(containerEl)
            .setName('Auto Refresh')
            .setDesc(
                'If active files will automatically be re-indexed when modified',
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.AUTO_REFRESH)
                    .onChange(async (value) => {
                        console.log(`Auto Refresh Toggle Value: ${value}`);
                        this.plugin.settings.AUTO_REFRESH = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
