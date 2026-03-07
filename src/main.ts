import { Plugin, type TAbstractFile, TFile } from "obsidian";
import { LinkSuggest } from "./editor/link-suggest";
import { NoteCacheService } from "./services/note-cache";
import type { LonksSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { LonksSettingsTab } from "./ui/settings-tab";

export default class LonksPlugin extends Plugin {
	settings: LonksSettings = DEFAULT_SETTINGS;
	private noteCache: NoteCacheService | null = null;
	private linkSuggest: LinkSuggest | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.noteCache = new NoteCacheService(this.app, this.settings);

		this.app.workspace.onLayoutReady(async () => {
			await this.noteCache?.rebuildCache();
			this.setupLinkSuggest();
		});

		this.registerEvent(
			this.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile && file.extension === "md") {
					this.noteCache?.updateFile(file);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", (file: TAbstractFile) => {
				if (file instanceof TFile && file.extension === "md") {
					this.noteCache?.removeFile(file.path);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("rename", (file: TAbstractFile, oldPath: string) => {
				if (file instanceof TFile && file.extension === "md") {
					this.noteCache?.removeFile(oldPath);
					this.noteCache?.updateFile(file);
				}
			}),
		);

		this.registerEvent(
			this.app.metadataCache.on("changed", (file: TFile) => {
				if (file.extension === "md") {
					this.noteCache?.updateFile(file);
				}
			}),
		);

		this.addSettingTab(new LonksSettingsTab(this.app, this));
		this.addCommand({
			id: "rebuild-note-cache",
			name: "Rebuild note cache",
			callback: async () => {
				await this.rebuildCache();
			},
		});
	}

	onunload(): void {}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.noteCache?.updateSettings(this.settings);
		this.setupLinkSuggest();
	}

	async rebuildCache(): Promise<void> {
		await this.noteCache?.rebuildCache();
	}

	getNoteCache(): NoteCacheService | null {
		return this.noteCache;
	}

	private setupLinkSuggest(): void {
		if (!this.noteCache) return;
		this.linkSuggest = new LinkSuggest(this.noteCache, this.settings);
		this.registerEditorSuggest(this.linkSuggest);
	}
}
