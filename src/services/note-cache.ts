import type { App, TFile } from "obsidian";
import type { CachedNote, LonksSettings } from "../types";

export class NoteCacheService {
	private app: App;
	private settings: LonksSettings;
	private noteIndex: Map<string, CachedNote[]> = new Map();
	private notes: CachedNote[] = [];

	constructor(app: App, settings: LonksSettings) {
		this.app = app;
		this.settings = settings;
	}

	getApp(): App {
		return this.app;
	}

	async rebuildCache(): Promise<void> {
		this.notes = [];
		this.noteIndex.clear();

		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			if (this.isExcluded(file.path)) continue;

			const cachedNote = await this.buildCachedNote(file);
			this.addToIndex(cachedNote);
		}
	}

	async updateFile(file: TFile): Promise<void> {
		this.removeFromIndex(file.path);
		if (!this.isExcluded(file.path)) {
			this.addToIndex(await this.buildCachedNote(file));
		}
	}

	removeFile(path: string): void {
		this.removeFromIndex(path);
	}

	findMatches(text: string): CachedNote[] {
		if (text.length < this.settings.minMatchLength) {
			return [];
		}

		const searchText = this.settings.caseSensitive ? text : text.toLowerCase();
		const matches: CachedNote[] = [];
		const seen = new Set<string>();

		// exact match
		const exact = this.noteIndex.get(searchText);
		if (exact) {
			for (const note of exact) {
				if (!seen.has(note.path)) {
					matches.push(note);
					seen.add(note.path);
				}
			}
		}

		// prefix match
		for (const [key, notes] of this.noteIndex) {
			if (key.startsWith(searchText) && key !== searchText) {
				for (const note of notes) {
					if (!seen.has(note.path)) {
						matches.push(note);
						seen.add(note.path);
					}
				}
			}
		}

		return matches.slice(0, 10);
	}

	hasExactMatch(text: string): CachedNote | null {
		const searchText = this.settings.caseSensitive ? text : text.toLowerCase();
		return this.noteIndex.get(searchText)?.[0] ?? null;
	}

	getAllNotes(): CachedNote[] {
		return [...this.notes];
	}

	hasDuplicateName(basename: string): boolean {
		const key = this.settings.caseSensitive ? basename : basename.toLowerCase();
		return (this.noteIndex.get(key)?.length ?? 0) > 1;
	}

	getLinkPath(note: CachedNote): string {
		if (this.hasDuplicateName(note.name)) {
			return note.path.replace(/\.md$/, "");
		}
		return note.name;
	}

	updateSettings(settings: LonksSettings): void {
		this.settings = settings;
	}

	private async buildCachedNote(file: TFile): Promise<CachedNote> {
		return { path: file.path, name: file.basename, aliases: this.getAliases(file) };
	}

	private getAliases(file: TFile): string[] {
		if (!this.settings.includeAliases) return [];

		const cache = this.app.metadataCache.getFileCache(file);
		const frontmatter = cache?.frontmatter;

		if (!frontmatter?.aliases) return [];

		if (Array.isArray(frontmatter.aliases)) {
			return frontmatter.aliases.filter((a): a is string => typeof a === "string");
		}

		if (typeof frontmatter.aliases === "string") {
			return [frontmatter.aliases];
		}

		return [];
	}

	private addToIndex(note: CachedNote): void {
		this.notes.push(note);

		const nameKey = this.settings.caseSensitive ? note.name : note.name.toLowerCase();
		this.addToMap(nameKey, note);

		for (const alias of note.aliases) {
			const aliasKey = this.settings.caseSensitive ? alias : alias.toLowerCase();
			this.addToMap(aliasKey, note);
		}
	}

	private addToMap(key: string, note: CachedNote): void {
		const existing = this.noteIndex.get(key) ?? [];
		existing.push(note);
		this.noteIndex.set(key, existing);
	}

	private removeFromIndex(path: string): void {
		this.notes = this.notes.filter((n) => n.path !== path);
		const oldIndex = this.noteIndex;
		this.noteIndex = new Map();
		for (const [key, notes] of oldIndex) {
			const filtered = notes.filter((n) => n.path !== path);
			if (filtered.length > 0) {
				this.noteIndex.set(key, filtered);
			}
		}
	}

	private isExcluded(path: string): boolean {
		return this.settings.excludedFolders.some(
			(folder) => path.startsWith(`${folder}/`) || path === folder,
		);
	}
}
