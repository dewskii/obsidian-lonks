export interface LonksSettings {
	minMatchLength: number;
	debounceDelay: number;
	includeAliases: boolean;
	caseSensitive: boolean;
	excludedFolders: string[];
	triggerMode: "auto" | "manual";
}

export const DEFAULT_SETTINGS: LonksSettings = {
	minMatchLength: 3,
	debounceDelay: 300,
	includeAliases: true,
	caseSensitive: false,
	excludedFolders: [],
	triggerMode: "auto",
};

export interface CachedNote {
	path: string;
	name: string;
	aliases: string[];
}

export interface LinkMatch {
	matchedText: string;
	note: CachedNote;
	from: number;
	to: number;
	isAlias: boolean;
}
