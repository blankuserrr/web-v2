import { createWindow } from "../gui/WindowArea";

export type WindowInformation = {
	title: string;
	width: string | number;
	minwidth: number;
	height: string | number;
	minheight: number;
	allowMultipleInstance: boolean;
	icon?: string;
	src?: string | URL | any;
	/**
	 * @description For Terbium Compatability only
	 */
	msg?: any;
};

export const AliceWM = {
	create: async (givenWinInfo: string | WindowInformation) => {
		console.trace();
		// Default param
		let wininfo: WindowInformation = {
			title: "Generic Window",
			minheight: 40,
			minwidth: 40,
			width: "1000px",
			height: "500px",
			allowMultipleInstance: false,
		};
		// Param given in argument
		if (typeof givenWinInfo == "object") wininfo = givenWinInfo;

		if (typeof givenWinInfo == "string")
			// Only title given
			wininfo.title = givenWinInfo;
		console.log(givenWinInfo);
		console.log(wininfo);
		console.log(wininfo);
		const n = await createWindow({
			title: wininfo.title,
			icon: wininfo.icon || "/assets/img/logo.png",
			src: "about:blank",
			size: {
				width: Number(wininfo.width),
				height: Number(wininfo.height),
			},
			single: false,
			resizable: true,
			message: wininfo.msg,
		});
		console.log(`created ${n}`);
		// Sorry I had to use DOM it was like the only way for actual cross compatability
		const elem = document.querySelector(`div[pid="${window.tb.window.getId()}"]`);
		window.tb.window.content.set("<div></div>");
		return {
			element: elem,
			content: elem?.querySelector("div:not([class]):not([pid]):not([style]):not([data-resizer]):not([message])"),
		};
	},
};
