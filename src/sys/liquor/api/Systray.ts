import { windowStore } from "../../Store";

export class SystrayIcon {
	onclick = () => {};
	onrightclick = () => {};
	get icon() {
		return "This API is not supported.";
	}
	get tooltip() {
		return "This API is not supported.";
	}
	destroy = () => {
		window.tb.window.island.removeControl("com.anura.genericsystray");
	};
}

export class Systray {
	icon: SystrayIcon[] = [];
	create = (args: any) => {
		const win = windowStore.windows.find((win: any) => win.pid === window.tb.window.getId());
		const title = win ? win.title : "Anura File Manager";
		window.tb.window.island.addControl({
			text: `${args.tooltip}`,
			// @ts-expect-error
			click: () => this.icon.onclick,
			appname: title,
			id: "com.anura.genericsystray",
		});
	};
}
