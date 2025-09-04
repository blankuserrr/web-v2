import type { UserSettings } from "../types";

interface ElectronWinArgs {
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	title?: string;
	icon?: string;
	resizable?: boolean;
	maximizable?: boolean;
	minimizable?: boolean;
}

export class BrowserWindow {
	constructor(args: ElectronWinArgs) {
		window.tb.window.create({
			title: args.title || "Lemonade Instance",
			size: {
				width: args.width || 500,
				height: args.height || 500,
				minWidth: args.minWidth || 300,
				minHeight: args.minHeight || 300,
			},
			icon: args.icon || "/assets/img/logo.png",
			resizable: args.resizable || true,
			maximizable: args.maximizable || true,
			minimizable: args.minimizable || true,
			src: "about:blank",
		});
	}

	loadFile(path: string) {
		window.tb.window.changeSrc(`/fs/${path}`);
	}

	async loadURL(src: string) {
		const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
		window.tb.window.changeSrc(settings.proxy === "Ultraviolet" ? `/uv/service/${await window.tb.proxy.encode(src, "XOR")}` : `/service/${await window.tb.proxy.encode(src, "XOR")}`);
	}

	destroy() {
		window.tb.window.close();
	}

	close() {
		window.tb.window.close();
	}

	show() {
		return "API Stub";
	}

	blur() {
		return "API Stub";
	}

	hide() {
		window.tb.window.minimize();
	}
}
