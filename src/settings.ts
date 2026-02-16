import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	mySetting: string;
	convexUrl: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
	convexUrl: "",
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Convex URL")
			.setDesc("The deployment URL of your Convex project")
			.addText((text) =>
				text
					.setPlaceholder("https://...")
					.setValue(this.plugin.settings.convexUrl)
					.onChange(async (value) => {
						this.plugin.settings.convexUrl = value;
						await this.plugin.saveSettings();
						// We might want to trigger a client reconnection here
						this.plugin.initializeConvex();
					}),
			);

		const statusDiv = containerEl.createDiv();
		statusDiv.style.marginTop = "10px";
		statusDiv.style.marginBottom = "10px";
		statusDiv.style.color = "var(--text-muted)";

		new Setting(containerEl)
			.setName("Test Connection")
			.setDesc("Check if the plugin can connect to your Convex backend")
			.addButton((button) =>
				button.setButtonText("Test Connection").onClick(async () => {
					statusDiv.setText("Checking...");
					statusDiv.style.color = "var(--text-normal)";
					const result = await this.plugin.checkConnection();
					statusDiv.setText(result);
					if (result.startsWith("Connection Failed")) {
						statusDiv.style.color = "var(--text-error)";
					} else {
						statusDiv.style.color = "var(--text-success)";
					}
				}),
			);

		// Move statusDiv to be after the button
		containerEl.appendChild(statusDiv);

		new Setting(containerEl)
			.setName("Settings #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
