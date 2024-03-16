// FROM obsidian-sample-plugin github repo, use as an example
import { App, PluginSettingTab, Setting, Plugin, TFile, FileSystemAdapter } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	OPENAI_API_KEY: string;
	EMBEDDING_MODEL: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	OPENAI_API_KEY: "",
	EMBEDDING_MODEL: "text-embedding-3-small"
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	basePath: string;
    lastIndexUpdate: number | undefined;

	private async embedDocument(filePath: string) {
		let document = "";
		try {
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				document = await this.app.vault.read(file);
			} else {
				throw new Error("File path does not point to a valid file.");
			}
		} catch (error) {
			console.error("Error reading file:", error);
		}

		if (!document) {
			throw new Error("Document did not contain any text")
		}

		const response = await fetch('https://api.openai.com/v1/embeddings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.settings.OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				input: document,
				model: this.settings.EMBEDDING_MODEL
			})
		});

		const data = await response.json();
		console.log(data);
	}

	async onload() {
		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			this.basePath = adapter.getBasePath();
		} else {
			this.basePath = "";
		}
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'index-documents',
			name: 'Index updated documents',
			callback: () => {
				console.log(this.app.vault.getMarkdownFiles())
				const currentTime = Date.now();
				for (const file of this.app.vault.getMarkdownFiles()) {
					if (this.lastIndexUpdate && file.stat.mtime > this.lastIndexUpdate) {
						console.log(`File changed since last index: ${file.path}`)
					}
				}

				this.lastIndexUpdate = currentTime;
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('OpenAI API Key to be used for embedding')
			.addText(text => text
				.setPlaceholder('Paste API Key Here')
				.setValue(this.plugin.settings.OPENAI_API_KEY)
				.onChange(async (value) => {
					this.plugin.settings.OPENAI_API_KEY = value;
					await this.plugin.saveSettings();
				}));
	}
}
