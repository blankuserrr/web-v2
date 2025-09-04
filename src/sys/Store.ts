import { init } from "@paralleldrive/cuid2";
import { createStore } from "solid-js/store";
import { createSignal } from "solid-js";
import { updateInfo } from "./gui/AppIsland";
import { type cmprops, fileExists, type WindowConfig } from "./types";

interface WindowState {
	windows: WindowConfig[];
	wid?: string;
	pid?: string;
	matchedWindows: WindowConfig[][];
	currentPID?: string;
}

interface ContextMenuState {
	menu: cmprops;
}

interface SearchMenuState {
	open: boolean;
}

export const createPID = () => {
	const chars = "0123456789";
	let result = "";
	const length = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
	const idGen = (): string => {
		for (let i = 0; i < length; i++) {
			result += chars[Math.floor(Math.random() * chars.length)];
		}
		return result;
	};
	return idGen();
};

export const createWID = () => {
	const cuid = init({
		length: 10,
	});
	return `w-${cuid()}`;
};

// Create the window store with proper SolidJS reactivity
const [windowStore, setWindowStore] = createStore<WindowState>({
	windows: [],
	matchedWindows: [],
	currentPID: undefined,
	wid: undefined,
	pid: undefined,
});

// Create reactive signals for external change notifications
const [windowsUpdateSignal, setWindowsUpdateSignal] = createSignal(0);

// Window store methods
const addWindow = async (config: WindowConfig) => {
	let recentApps: any[];
	if (await fileExists("/system/var/terbium/recent.json")) {
		recentApps = JSON.parse(await Filer.fs.promises.readFile("/system/var/terbium/recent.json", "utf8"));
	} else {
		await Filer.fs.promises.writeFile("/system/var/terbium/recent.json", JSON.stringify([], null, 2), "utf8").catch(err => console.error(err));
		recentApps = [];
	}

	const indexes = windowStore.windows.map(w => w.zIndex ?? 0);
	config.zIndex = Math.max(...indexes) + 1;
	config.focused = true;
	if (config.zIndex === Number.NEGATIVE_INFINITY) {
		config.zIndex = 2;
	}

	// Update existing windows focus and z-index
	setWindowStore("windows", windows =>
		windows.map(w => {
			if (w.wid !== config.wid) {
				return {
					...w,
					focused: false,
					zIndex: w.zIndex !== undefined ? w.zIndex - 1 : w.zIndex,
				};
			}
			return w;
		}),
	);

	const matched = windowStore.matchedWindows.findIndex(group => group.some(w => (typeof w.title === "string" ? w.title : w.title?.text) === (typeof config.title === "string" ? config.title : config.title?.text)));

	config.wid = createWID();
	config.pid = createPID();

	if (matched !== -1) {
		setWindowStore("matchedWindows", matched, group => [...group, config]);
	} else {
		setWindowStore("matchedWindows", groups => [...groups, [config]]);
	}

	const appName = typeof config.title === "string" ? config.title : config.title?.text;
	let configData: any = null;
	try {
		const data = JSON.parse(await Filer.fs.promises.readFile(`/apps/system/${appName.toLowerCase()}.tapp/index.json`, "utf8")).config;
		configData = {
			...data,
			weight: 1,
		};
	} catch {
		configData = {
			title: appName,
			icon: config.icon,
			src: config.src,
			weight: 1,
		};
	}

	if (recentApps.length > 10) {
		const lowestWeight = Math.min(...recentApps.map((app: any) => app.weight));
		const lowestWeightIndex = recentApps.findIndex((app: any) => app.weight === lowestWeight);
		recentApps.splice(lowestWeightIndex, 1);
	}

	const recentAppIndex = recentApps.findIndex((app: any) => {
		return (typeof app.title === "string" ? app.title.toLowerCase() : app.title?.text.toLowerCase()) === (typeof configData.title === "string" ? configData.title.toLowerCase() : configData.title?.text.toLowerCase());
	});

	if (recentAppIndex === -1) {
		recentApps.push(configData);
	} else {
		recentApps[recentAppIndex].weight += 1;
	}
	await Filer.fs.promises.writeFile("/system/var/terbium/recent.json", JSON.stringify(recentApps, null, 2), "utf8").catch((err: any) => {
		console.error("Error writing recent apps file:", err);
	});

	globalThis.dispatchEvent(new CustomEvent("selwin-upd", { detail: typeof config.title === "string" ? config.title : config.title?.text }));

	setWindowStore("windows", windows => [...windows, config]);
	setWindowStore("currentPID", config.pid);

	// Trigger reactive updates
	setWindowsUpdateSignal(prev => prev + 1);
	globalThis.dispatchEvent(new CustomEvent("windowsUpdated", { detail: { action: "add", window: config } }));
};

const killWindow = (pid: string) => {
	const windows = windowStore.windows.filter((w: any) => w.pid !== pid);
	const matchedWindows = windowStore.matchedWindows
		.map((group: any) => {
			const newGroup = group.filter((w: any) => w.pid !== pid);
			return newGroup.length > 0 ? newGroup : null;
		})
		.filter((group: any) => group !== null);

	const indexes = windows.map((w: any) => w.zIndex ?? 0);
	const highest = Math.max(...indexes);
	const win = windows.find((w: any) => w.zIndex === highest);

	if (win) {
		win.focused = true;
		updateInfo({ appname: typeof win.title === "string" ? win.title : win.title?.text });
		globalThis.dispatchEvent(new CustomEvent("selwin-upd", { detail: typeof win.title === "string" ? win.title : win.title?.text }));
	}

	setWindowStore("windows", windows);
	setWindowStore("matchedWindows", matchedWindows);

	// Trigger reactive updates
	setWindowsUpdateSignal(prev => prev + 1);
	globalThis.dispatchEvent(new CustomEvent("windowsUpdated", { detail: { action: "kill", pid } }));
};

const removeWindow = (wid: string) => {
	const windows = windowStore.windows.filter((w: any) => w.wid !== wid);
	const matchedWindows = windowStore.matchedWindows
		.map((group: any) => {
			const newGroup = group.filter((w: any) => w.wid !== wid);
			return newGroup.length > 0 ? newGroup : null;
		})
		.filter((group: any) => group !== null);

	const indexes = windows.map((w: any) => w.zIndex ?? 0);
	const highest = Math.max(...indexes);
	const win = windows.find((w: any) => w.zIndex === highest);

	if (win) {
		win.focused = true;
		updateInfo({ appname: typeof win.title === "string" ? win.title : win.title?.text });
		globalThis.dispatchEvent(new CustomEvent("selwin-upd", { detail: typeof win.title === "string" ? win.title : win.title?.text }));
	}

	setWindowStore("windows", windows);
	setWindowStore("matchedWindows", matchedWindows);
};

const arrange = (wid: string) => {
	const idx = windowStore.windows.findIndex(w => w.wid === wid);
	if (idx === -1) return;
	const winItem = windowStore.windows[idx];
	setWindowStore("currentPID", winItem.pid);

	// Compute next z-index for the focused window
	const indexes = windowStore.windows.map(w => w.zIndex ?? 0);
	const newZ = Math.max(...indexes) + 1;

	// Focus selected window without replacing objects
	setWindowStore("windows", idx, { focused: true, zIndex: newZ });

	// Defocus and lower others in place
	for (let i = 0; i < windowStore.windows.length; i++) {
		if (i === idx) continue;
		const currZ = windowStore.windows[i].zIndex ?? 0;
		setWindowStore("windows", i, {
			focused: false,
			zIndex: currZ > 0 ? currZ - 1 : currZ,
		});
	}

	// Trigger reactive updates
	setWindowsUpdateSignal(prev => prev + 1);
	globalThis.dispatchEvent(new CustomEvent("windowsUpdated", { detail: { action: "arrange", wid } }));
};

const minimize = (wid: string) => {
	setWindowStore("windows", windows =>
		windows.map(w => {
			if (w.wid === wid) {
				return { ...w, focused: false };
			}
			return w;
		}),
	);

	// Trigger reactive updates
	setWindowsUpdateSignal(prev => prev + 1);
};

const getWindow = (wid: string) => {
	return windowStore.windows.find(w => w.wid === wid);
};

// Create the context menu store
const [contextMenuStore, setContextMenuStore] = createStore<ContextMenuState>({
	menu: { x: 0, y: 0, options: [] },
});

// Context menu store methods
const setContextMenu = (options: cmprops) => {
	setContextMenuStore("menu", options);
};

const clearContextMenu = () => {
	setContextMenuStore("menu", { x: 0, y: 0, options: [] });
};

// Create the search menu store
const [searchMenuStore, setSearchMenuStore] = createStore<SearchMenuState>({
	open: false,
});

// Search menu store methods and refs
const setSearchMenuOpen = (open: boolean) => {
	setSearchMenuStore("open", open);
};

// SolidJS refs used by Search/Dock
let searchRef: HTMLInputElement | undefined;
let searchMenuRef: HTMLDivElement | undefined;

// Allow components to set the live refs (so Dock can read them)
const setSearchRefs = (sr: HTMLInputElement | undefined, smr: HTMLDivElement | undefined) => {
	searchRef = sr;
	searchMenuRef = smr;
};

// Reactive window store hook for SolidJS components
// Returns accessor getters so reads stay reactive and always reflect the latest store values
const useWindowStore = () => {
	return {
		get windows() {
			return windowStore.windows;
		},
		get matchedWindows() {
			return windowStore.matchedWindows;
		},
		get currentPID() {
			return windowStore.currentPID;
		},
		get wid() {
			return windowStore.wid;
		},
		get pid() {
			return windowStore.pid;
		},
		addWindow,
		killWindow,
		removeWindow,
		arrange,
		minimize,
		getWindow,
	};
};

// Add static getState method for compatibility with existing API calls
useWindowStore.getState = () => ({
	windows: windowStore.windows,
	matchedWindows: windowStore.matchedWindows,
	currentPID: windowStore.currentPID,
	wid: windowStore.wid,
	pid: windowStore.pid,
	addWindow,
	killWindow,
	removeWindow,
	arrange,
	minimize,
	getWindow,
});

const useContextMenuStore = () => ({
	menu: contextMenuStore.menu,
	setContextMenu,
	clearContextMenu,
});

const useSearchMenuStore = () => ({
	open: searchMenuStore.open,
	setOpen: setSearchMenuOpen,
	// accessors return the latest refs
	get searchRef() {
		return { current: searchRef } as { current: HTMLInputElement | undefined };
	},
	get searchMenuRef() {
		return { current: searchMenuRef } as { current: HTMLDivElement | undefined };
	},
	setRefs: setSearchRefs,
});

// Export stores, methods, and compatibility hooks
export {
	addWindow,
	arrange,
	clearContextMenu,
	contextMenuStore,
	getWindow,
	killWindow,
	minimize,
	removeWindow,
	searchMenuRef,
	searchMenuStore,
	searchRef,
	setContextMenu,
	setSearchMenuOpen,
	useContextMenuStore,
	useSearchMenuStore,
	// Compatibility hooks for existing components
	useWindowStore,
	// New SolidJS exports
	windowStore,
	// Reactive signal for external use
	windowsUpdateSignal,
	// Setters for search refs
	setSearchRefs,
};
