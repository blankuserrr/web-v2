import { AliceWM, type WindowInformation } from "../AliceWM";
import type { App } from "../coreapps/App";

export class WMAPI {
	// @ts-expect-error
	windows: WeakRef<any>[] = [];
	async create(ctx: App | any, info: WindowInformation, onfocus: (() => void) | null = null, onresize: ((w: number, h: number) => void) | null = null) {
		const win = await AliceWM.create(ctx);
		// @ts-expect-error stfu
		this.windows.push(new WeakRef(win));
		return win;
	}
	async createGeneric(ctx: App, info: object) {
		if (!info) {
			info = {
				title: "Generic Window",
				icon: "/assets/img/logo.png",
				minheight: 40,
				minwidth: 40,
				width: "1000px",
				height: "500px",
				allowMultipleInstance: false,
			};
		}
		// @ts-expect-error
		const win = await AliceWM.create(info);
		//ctx.windows.push(win); This was causing problems
		// @ts-expect-error stfu
		this.windows.push(new WeakRef(win));
		return win;
	}
}
