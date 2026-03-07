import type { App } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";
import type LonksPlugin from "../main";

export class LonksSettingsTab extends PluginSettingTab {
	plugin: LonksPlugin;

	constructor(app: App, plugin: LonksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Lonks Settings" });

		new Setting(containerEl)
			.setName("Trigger mode")
			.setDesc("How suggestions are triggered")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("auto", "Automatic (show suggestions while typing)")
					.addOption("manual", "Manual (use hotkey only)")
					.setValue(this.plugin.settings.triggerMode)
					.onChange(async (value) => {
						this.plugin.settings.triggerMode = value as "auto" | "manual";
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Minimum match length")
			.setDesc("Minimum characters before showing suggestions")
			.addSlider((slider) =>
				slider
					.setLimits(2, 10, 1)
					.setValue(this.plugin.settings.minMatchLength)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.minMatchLength = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Debounce delay")
			.setDesc("Delay in milliseconds before checking for matches")
			.addSlider((slider) =>
				slider
					.setLimits(100, 1000, 50)
					.setValue(this.plugin.settings.debounceDelay)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.debounceDelay = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Include aliases")
			.setDesc("Match against note aliases from frontmatter")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.includeAliases).onChange(async (value) => {
					this.plugin.settings.includeAliases = value;
					await this.plugin.saveSettings();
					await this.plugin.rebuildCache();
				}),
			);

		new Setting(containerEl)
			.setName("Case sensitive")
			.setDesc("Require exact case matching")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.caseSensitive).onChange(async (value) => {
					this.plugin.settings.caseSensitive = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Excluded folders")
			.setDesc("Folders to exclude from suggestions (one per line)")
			.addTextArea((text) =>
				text
					.setPlaceholder("templates\narchive")
					.setValue(this.plugin.settings.excludedFolders.join("\n"))
					.onChange(async (value) => {
						this.plugin.settings.excludedFolders = value
							.split("\n")
							.map((f) => f.trim())
							.filter((f) => f.length > 0);
						await this.plugin.saveSettings();
						await this.plugin.rebuildCache();
					}),
			);

		containerEl.createEl("h3", { text: "Cache Statistics" });

		const statsDiv = containerEl.createDiv();
		const noteCount = this.plugin.getNoteCache()?.getAllNotes().length ?? 0;
		statsDiv.createEl("p", {
			text: `Notes indexed: ${noteCount}`,
		});
	}
}
