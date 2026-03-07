import type {
	Editor,
	EditorPosition,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import { EditorSuggest } from "obsidian";
import type { NoteCacheService } from "../services/note-cache";
import type { CachedNote, LonksSettings } from "../types";

interface LinkSuggestion {
	note: CachedNote;
	matchedAlias: string | null;
}

export class LinkSuggest extends EditorSuggest<LinkSuggestion> {
	constructor(
		private noteCache: NoteCacheService,
		private settings: LonksSettings,
	) {
		super(noteCache.getApp());
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		file: TFile | null,
	): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		const textBeforeCursor = line.slice(0, cursor.ch);

		if (this.isInsideLink(textBeforeCursor)) return null;

		const wordMatch = textBeforeCursor.match(/[\w-]+$/);
		if (!wordMatch || wordMatch[0].length < this.settings.minMatchLength) return null;

		const word = wordMatch[0];
		const currentPath = file?.path ?? null;
		const matches = this.noteCache.findMatches(word).filter((n) => n.path !== currentPath);

		if (matches.length === 0) return null;

		return {
			start: { line: cursor.line, ch: cursor.ch - word.length },
			end: cursor,
			query: word,
		};
	}

	getSuggestions(context: EditorSuggestContext): LinkSuggestion[] {
		const { query } = context;
		const currentPath = context.file?.path ?? null;

		const matches = this.noteCache.findMatches(query).filter((note) => note.path !== currentPath);

		matches.sort((a, b) => {
			const aBoost = this.getMatchBoost(a, query);
			const bBoost = this.getMatchBoost(b, query);
			return bBoost - aBoost;
		});

		return matches.map((note) => ({
			note,
			matchedAlias: this.getMatchedAlias(note, query),
		}));
	}

	renderSuggestion(suggestion: LinkSuggestion, el: HTMLElement): void {
		const { note, matchedAlias } = suggestion;
		const hasDuplicate = this.noteCache.hasDuplicateName(note.name);

		el.addClass("mod-complex");
		const content = el.createDiv({ cls: "suggestion-content" });
		const titleEl = content.createDiv({ cls: "suggestion-title" });
		titleEl.createSpan({ text: matchedAlias ?? note.name });

		const noteEl = content.createDiv({ cls: "suggestion-note" });
		if (matchedAlias) {
			noteEl.setText(note.name);
		} else if (hasDuplicate) {
			noteEl.setText(note.path);
		} else {
			noteEl.setText(this.getDisplayPath(note.path));
		}

		const aux = el.createDiv({ cls: "suggestion-aux" });

		if (hasDuplicate) {
			aux.createSpan({ cls: "suggestion-flair", text: "Duplicate name" });
		} else if (note.aliases.length > 0) {
			aux.createSpan({ cls: "suggestion-flair", text: `Aliases: ${note.aliases.join(", ")}` });
		}
	}

	selectSuggestion(suggestion: LinkSuggestion, _evt: MouseEvent | KeyboardEvent): void {
		const { note, matchedAlias } = suggestion;
		if (!this.context) return;

		const { editor, start, end } = this.context;
		const linkPath = this.noteCache.getLinkPath(note);
		const hasDuplicate = this.noteCache.hasDuplicateName(note.name);

		let linkText: string;

		if (matchedAlias) {
			linkText = `[[${linkPath}|${matchedAlias}]]`;
		} else if (hasDuplicate) {
			linkText = `[[${linkPath}|${note.name}]]`;
		} else {
			linkText = `[[${note.name}]]`;
		}

		editor.replaceRange(linkText, start, end);
	}

	private isInsideLink(text: string): boolean {
		let depth = 0;

		for (let i = 0; i < text.length - 1; i++) {
			if (text[i] === "[" && text[i + 1] === "[") {
				depth++;
				i++;
			} else if (text[i] === "]" && text[i + 1] === "]") {
				depth--;
				i++;
			}
		}

		return depth > 0;
	}

	// priority - exact, starts with, alias exact, alias starts with
	private getMatchBoost(note: CachedNote, query: string): number {
		const q = query.toLowerCase();

		if (note.name.toLowerCase() === q) return 5;
		if (note.name.toLowerCase().startsWith(q)) return 3;

		for (const alias of note.aliases) {
			if (alias.toLowerCase() === q) return 4;
			if (alias.toLowerCase().startsWith(q)) return 2;
		}

		return 1;
	}

	private getMatchedAlias(note: CachedNote, query: string): string | null {
		const q = query.toLowerCase();
		if (note.name.toLowerCase() === q || note.name.toLowerCase().startsWith(q)) return null;

		for (const alias of note.aliases) {
			if (alias.toLowerCase() === q || alias.toLowerCase().startsWith(q)) return alias;
		}

		return null;
	}

	private getDisplayPath(fullPath: string): string {
		const path = fullPath.replace(/\.md$/, "");
		const parts = path.split("/");

		if (parts.length > 2) {
			return parts.slice(-2).join("/");
		}

		return path;
	}
}
