import * as fs from 'fs';
import * as path from 'path';
import VectorDatabase from 'vector';
import { EMBEDDING_VIEW_TYPE, EmbeddingView } from 'view';
import { App, PluginSettingTab, Setting, Plugin, TFile, WorkspaceLeaf, FileSystemAdapter } from 'obsidian';

interface PluginSettings {
	OPENAI_API_KEY: string;
	EMBEDDING_MODEL: string;
	VECTORDATABASE_PATH: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	OPENAI_API_KEY: '',
	EMBEDDING_MODEL: 'text-embedding-3-small',
	VECTORDATABASE_PATH: 'vectors.json'
}

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

		this.initVectorDatabase();

		this.registerView(
			EMBEDDING_VIEW_TYPE,
			(leaf) => new EmbeddingView(leaf, this.vectorDatabase)
		)

		this.addCommand({
			id: 'index-documents',
			name: 'Index updated documents',
			callback: () => {
				const currentTime = Date.now();
				const modifiedFiles = this.app.vault.getMarkdownFiles().filter(file => file.stat.mtime > this.lastIndexUpdate).map(file => file.path);
				if (modifiedFiles.length) {
					this.embedDocuments(modifiedFiles);
					this.lastIndexUpdate = currentTime;
				}
			}
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
			leaf = leaves[0]
		} else {
			leaf = workspace.getLeaf(false) as WorkspaceLeaf;
			await leaf.setViewState({ type: EMBEDDING_VIEW_TYPE, active: true });
		}

		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	
		if (this.lastIndexUpdate === undefined && !fs.existsSync(this.settings.VECTORDATABASE_PATH)) {
			this.lastIndexUpdate = 0
		}
	
		if (fs.existsSync(this.settings.VECTORDATABASE_PATH)) {
			this.lastIndexUpdate = Date.now();
		}
	}

	initVectorDatabase() {
		this.vectorDatabase = new VectorDatabase(path.join(this.basePath, this.manifest.dir as string, this.settings.VECTORDATABASE_PATH));
		if (fs.existsSync(this.settings.VECTORDATABASE_PATH)) {
			this.vectorDatabase.loadFromFile();
		}

		const allFiles = this.app.vault.getMarkdownFiles().map(file => file.path);
		const filesToEmbed = allFiles.filter(filePath => !this.vectorDatabase.has(filePath));
		if (filesToEmbed.length > 0) {
			this.embedDocuments(filesToEmbed);
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async embedDocuments(filePaths: string[]) {
		const documents = [];
		try {
			for (const filePath of filePaths) {
				const file = this.app.vault.getAbstractFileByPath(filePath);
				if (file instanceof TFile) {
					const document = await this.app.vault.read(file);
					if (!document) {
						throw new Error('Document did not contain any text')
					}
					documents.push(document);
				} else {
					throw new Error('File path does not point to a valid file.');
				}
			}
		} catch (error) {
			console.error('Error reading file:', error);
		}

		if (documents.length === 0) {
			throw new Error('No valid documents found')
		}

		const response = await fetch('https://api.openai.com/v1/embeddings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.settings.OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				input: documents,
				model: this.settings.EMBEDDING_MODEL
			})
		});


		if (response.status !== 200) {
			throw new Error(`Request failed: ${response.body}`)
		}

		const embeddingResponse = await response.json();
		if (embeddingResponse.data) {
			for (let i = 0; i < embeddingResponse.data.length; i++) {
				const fullEmbedding = embeddingResponse.data[i].embedding;
				const vector = {
					id: filePaths[i],
					fullEmbedding,
					reducedEmbedding: VectorDatabase.l2Normalization(fullEmbedding)
				}
				this.vectorDatabase.add(vector);
			}
		} else {
			throw new Error('No embeddings found in the response');
		}
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;
	apiKeyLoaded: boolean

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.apiKeyLoaded = plugin.settings.OPENAI_API_KEY != '' ?? false;
	}

	private obfuscateKey(apiKey: string) {
		return apiKey.slice(0, 3) + '***' + apiKey.slice(-3);
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('OpenAI API Key to be used for embedding')
			.addText(text => text
				.setPlaceholder(this.apiKeyLoaded ? this.obfuscateKey(this.plugin.settings.OPENAI_API_KEY) : 'Paste API Key Here')
				.setValue(this.apiKeyLoaded ? this.obfuscateKey(this.plugin.settings.OPENAI_API_KEY) : '')
				.onChange(async (value) => {
					this.plugin.settings.OPENAI_API_KEY = value;

					if (!this.apiKeyLoaded) {
						this.apiKeyLoaded = true;
						this.display();
					} else {
						await this.plugin.saveSettings();
					}
				}
			)
		);

		new Setting(containerEl)
			.setName('Embedding Model')
			.setDesc('Select Embedding Model')
			.addDropdown(dropdown => dropdown
				.addOption('text-embedding-3-large', 'OpenAI: text-embedding-3-large')
				.addOption('text-embedding-3-small', 'OpenAI: text-embedding-3-small')
				.addOption('mistral-7b-v0.1', 'Local: mistral-7b-v0.1')
				.setValue(this.plugin.settings.EMBEDDING_MODEL)
				.onChange(async (value) => {
					this.plugin.settings.EMBEDDING_MODEL = value;
					await this.plugin.saveSettings();
				}
			)
		);
	}
}
