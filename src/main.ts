import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	TFile,
} from "obsidian";
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from "./settings";
import { ConvexClient } from "convex/browser";
// Note: These imports will fail until `npx convex dev` is run to generate the API
// using specific "any" types to avoid build errors for now if possible, or we just let it fail
// but to be safe I will use 'any' for the API calls until we have the generated types
// import { api } from "../convex/_generated/api";

// We'll define a placeholder for api to avoid compilation errors before codegen
// We'll define a placeholder for api to avoid compilation errors before codegen
const api: any = {
	documents: {
		saveDocument: "documents:saveDocument",
		deleteDocument: "documents:deleteDocument",
		getDocument: "documents:getDocument",
		listDocuments: "documents:listDocuments",
	},
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	convexClient: ConvexClient | null = null;

	async onload() {
		await this.loadSettings();

		this.initializeConvex();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon("dice", "Sync Now", (evt: MouseEvent) => {
			this.syncAll();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Convex Sync: Ready");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "sync-now",
			name: "Sync Now",
			callback: () => {
				this.syncAll();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.saveFileToConvex(file);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.saveFileToConvex(file);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.deleteFileFromConvex(file);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFile && file.extension === "md") {
					// We can either update the path or delete old and create new
					// For simplicity, let's delete old and create new for now, or update if we had an ID
					// But our schema uses path as index.
					this.deleteFileFromConvex({ path: oldPath } as TFile);
					this.saveFileToConvex(file);
				}
			}),
		);
	}

	initializeConvex() {
		if (this.settings.convexUrl) {
			try {
				this.convexClient = new ConvexClient(this.settings.convexUrl);
				new Notice("Convex Client Initialized");
			} catch (e) {
				console.error("Failed to initialize Convex Client", e);
				new Notice("Failed to initialize Convex Client");
			}
		}
	}

	async checkConnection(): Promise<string> {
		if (!this.convexClient)
			return "Convex Client not initialized (Check URL)";

		// Basic URL validation
		if (!this.settings.convexUrl.includes("https://")) {
			return "Error: URL must start with 'https://'";
		}
		if (!this.settings.convexUrl.includes(".convex.cloud")) {
			return "Warning: URL usually ends in '.convex.cloud'. Did you paste just the project name?";
		}

		try {
			// @ts-ignore
			const result = await Promise.race([
				this.convexClient.query(api.documents.listDocuments, {}),
				new Promise((_, reject) =>
					setTimeout(
						() => reject(new Error("Connection timed out (5s)")),
						5000,
					),
				),
			]);
			return `Connection Successful! Found ${
				result ? result.length : 0
			} documents.`;
		} catch (e: any) {
			console.error("Connection check failed", e);
			return `Connection Failed: ${e.message || e}`;
		}
	}

	async saveFileToConvex(file: TFile) {
		if (!this.convexClient) return;
		const content = await this.app.vault.read(file);
		try {
			await this.convexClient.mutation(api.documents.saveDocument, {
				path: file.path,
				content: content,
			});
			// console.log(`Saved ${file.path} to Convex`);
		} catch (e: any) {
			console.error(`Failed to save ${file.path}`, e);
			new Notice(`Failed to save to Convex: ${e.message || e}`);
		}
	}

	async deleteFileFromConvex(file: TFile) {
		if (!this.convexClient) return;
		try {
			await this.convexClient.mutation(api.documents.deleteDocument, {
				path: file.path,
			});
			// console.log(`Deleted ${file.path} from Convex`);
		} catch (e) {
			console.error(`Failed to delete ${file.path}`, e);
		}
	}

	async syncAll() {
		new Notice("Syncing all files...");
		const files = this.app.vault.getMarkdownFiles();
		for (const file of files) {
			await this.saveFileToConvex(file);
		}
		new Notice("Sync complete");
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
