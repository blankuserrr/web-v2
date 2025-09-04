interface ThemeProps {
	foreground: string;
	secondaryForeground: string;
	border: string;
	darkBorder: string;
	background: string | any;
	secondaryBackground: string;
	darkBackground: string;
	accent: string | any;
}
let settings: ThemeProps = {
	foreground: "#ffffff",
	secondaryForeground: "#ffffff38",
	border: "#ffffff28",
	darkBorder: "#333333",
	background: "#0e0e0e",
	secondaryBackground: "#383838",
	darkBackground: "#161616",
	accent: "#32ae62",
};

// Initialize theme settings when file system is ready
let themeInitialized = false;

const initializeTheme = async () => {
	if (themeInitialized) return;

	try {
		const data = await Filer.fs.promises.readFile("/system/etc/anura/theme.json", "utf8");
		settings = JSON.parse(data);
		themeInitialized = true;
	} catch (_err) {
		// File doesn't exist yet or filesystem not ready - use defaults
		// Don't try to create file immediately as filesystem may not be initialized
	}
};

// Try to initialize theme, but don't block if filesystem isn't ready
initializeTheme().catch(() => {
	// Silently fail, will use default settings
});

export class Theme implements ThemeProps {
	get foreground() {
		// Try to initialize theme if not already done
		if (!themeInitialized) {
			initializeTheme().catch(() => {});
		}
		return settings.foreground;
	}

	set foreground(value) {
		settings.foreground = value;
		this.saveSettings();
	}

	private async saveSettings() {
		try {
			// Ensure directory exists
			await Filer.fs.promises.mkdir("/system/etc/anura/", { recursive: true });
			await Filer.fs.promises.writeFile("/system/etc/anura/theme.json", JSON.stringify(settings));
		} catch (err) {
			console.error("Error saving theme settings:", err);
		}
	}

	get secondaryForeground() {
		if (!themeInitialized) {
			initializeTheme().catch(() => {});
		}
		return settings.secondaryForeground;
	}

	set secondaryForeground(value) {
		settings.secondaryForeground = value;
		this.saveSettings();
	}

	get border() {
		if (!themeInitialized) {
			initializeTheme().catch(() => {});
		}
		return settings.border;
	}

	set border(value) {
		settings.border = value;
		this.saveSettings();
	}

	get darkBorder() {
		if (!themeInitialized) {
			initializeTheme().catch(() => {});
		}
		return settings.darkBorder;
	}

	set darkBorder(value) {
		settings.darkBorder = value;
		this.saveSettings();
	}

	get background() {
		if (!themeInitialized) {
			initializeTheme().catch(() => {});
		}
		return settings.background;
	}

	set background(value) {
		settings.background = value;
		this.saveSettings();
	}

	get secondaryBackground() {
		if (!themeInitialized) {
			initializeTheme().catch(() => {});
		}
		return settings.secondaryBackground;
	}

	set secondaryBackground(value) {
		settings.secondaryBackground = value;
		this.saveSettings();
	}

	get darkBackground() {
		if (!themeInitialized) {
			initializeTheme().catch(() => {});
		}
		return settings.darkBackground;
	}

	set darkBackground(value) {
		settings.darkBackground = value;
		this.saveSettings();
	}

	get accent() {
		if (!themeInitialized) {
			initializeTheme().catch(() => {});
		}
		return settings.accent;
	}

	set accent(value) {
		settings.accent = value;
		this.saveSettings();
	}

	cssPropMap: Record<keyof ThemeProps, string[]> = {
		background: ["--theme-bg", "--material-bg"],
		border: ["--theme-border", "--material-border"],
		darkBorder: ["--theme-dark-border"],
		foreground: ["--theme-fg"],
		secondaryBackground: ["--theme-secondary-bg"],
		secondaryForeground: ["--theme-secondary-fg"],
		darkBackground: ["--theme-dark-bg"],
		accent: ["--theme-accent", "--matter-helper-theme"],
	};

	state: ThemeProps = settings;

	css(): string {
		const lines = [];
		lines.push(":root {");
		for (const key in this.state) {
			for (const prop of this.cssPropMap[key as keyof ThemeProps]) {
				lines.push(`  ${prop}: ${this.state[key as keyof ThemeProps]};`);
			}
		}
		lines.push("}");
		return lines.join("\n");
	}

	reset() {
		(this.foreground = "#ffffff"), (this.secondaryForeground = "#ffffff38"), (this.border = "#ffffff28"), (this.darkBorder = "#333333"), (this.background = "#0e0e0e"), (this.secondaryBackground = "#383838"), (this.darkBackground = "#161616"), (this.accent = "#32ae62");
	}
}
