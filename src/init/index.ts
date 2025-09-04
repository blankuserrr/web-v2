import { Filer, dirExists } from "../sys/types";
import apps from "../apps.json";
import { copyfs } from "./fs.init";
import { hash } from "../hash.json";

export async function init() {
	/**
	 * create home structure
	 */
	console.log("Initing File System please wait...");
	if (!(await dirExists("/home"))) {
		await Filer.promises.mkdir("/home");
	}
	const user = JSON.parse(`${sessionStorage.getItem("new-user")}`).username;

	/**
	 * create apps structure
	 */
	if (!(await dirExists("/apps"))) {
		await Filer.promises.mkdir("/apps");
		await Filer.promises.mkdir("/apps/system");
		await Filer.promises.mkdir("/apps/user");
		await Filer.promises.writeFile("/apps/web_apps.json", JSON.stringify({ apps: [] }));
	} else {
		if (!(await dirExists("/apps/user"))) {
			await Filer.promises.mkdir("/apps/user");
		}
	}

	if (!(await dirExists(`/apps/user/${user}`))) {
		await Filer.promises.mkdir(`/apps/user/${user}`);
		await Filer.promises.mkdir(`/apps/user/${user}/files`);
		await Filer.promises.mkdir(`/apps/user/${user}/terminal`);
	}

	/**
	 * create system structure
	 */
	if (!(await dirExists("/system"))) {
		await Filer.promises.mkdir("/system");
		await Filer.promises.mkdir("/system/trash");
		await Filer.promises.mkdir("/system/bin");
		await Filer.promises.mkdir("/system/etc");
		await Filer.promises.mkdir("/system/etc/terbium");
		const stockSettings = {
			theme: "dark",
			"system-blur": true,
			"dock-full": false,
			fileAssociatedApps: {
				text: "text-editor",
				image: "media-viewer",
				video: "media-viewer",
				audio: "media-viewer",
			},
			location: "40.7831,-73.9712",
			weather: {
				unit: "Celsius",
			},
			"host-name": "terbium",
		};
		await Filer.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(stockSettings));
		await Filer.promises.writeFile("/system/etc/terbium/sudousers.json", JSON.stringify([]));
		await Filer.promises.mkdir("/system/etc/terbium/wallpapers");
		await Filer.promises.mkdir("/system/var");
		await Filer.promises.mkdir("/system/var/terbium");
		await Filer.promises.writeFile("/system/etc/terbium/hash.cache", hash);
		const startApps = {
			system_apps: [
				{
					title: "Terminal",
					icon: "/fs/apps/system/terminal.tapp/icon.svg",
					src: "/fs/apps/system/terminal.tapp/index.html",
					size: {
						width: 400,
						height: 400,
					},
				},
				{
					title: "Files",
					icon: "/fs/apps/system/files.tapp/icon.svg",
					src: "/fs/apps/system/files.tapp/index.html",
					size: {
						width: 600,
						height: 500,
					},
				},
				{
					title: "Settings",
					icon: "/fs/apps/system/settings.tapp/icon.svg",
					src: "/fs/apps/system/settings.tapp/index.html",
					single: true,
				},
				{
					title: {
						text: "App Store",
						html: `<div style="display: flex; flex-direction: row; height: 32px"; margin-top: -32px;><input class="app-search bg-white/15 border-0 outline-hidden text-white py-1 px-2 rounded-lg transition-all duration-150 ease-in-out font-semibold cursor-text" type="search" placeholder="Search for apps" /><select drag="false" id="repo-inp" class="bg-[#ffffff20] absolute z-9 max-h-[160px] rounded-lg cursor-pointer backdrop-blur-[100px] overflow-auto transition-all duration-150 ease-in-out h-8 w-[130px] right-[70px] text-center flex items-center justify-center" onchange="(function(){const selectValue = document.getElementById('repo-inp').value;if (selectValue === 'cust') {tb.dialog.Message({title: 'Enter Custom TB Repository',onOk: async (val) => {localStorage.setItem('appRepo', val);}});tb.window.reload()} else {localStorage.setItem('appRepo', selectValue);} tb.window.reload()})()"><option style="background-color: #00000096; text-align: center;" value="https://raw.githubusercontent.com/terbiumOS/app-repo/main/apps.json">TB Main</option><option style="background-color: #00000096; text-align: center;" value="https://raw.githubusercontent.com/Notplayingallday383/app-repo/main/apps.json">XSTARS Xtras</option><option style="background-color: #00000096; text-align: center;" value="cust">Custom Repo</option></select></div>`,
					},
					icon: "/fs/apps/system/app store.tapp/icon.svg",
					src: "/fs/apps/system/app store.tapp/index.html",
					size: {
						width: 775,
						height: 500,
					},
				},
				{
					title: "Browser",
					icon: "/apps/browser.tapp/icon.svg",
					src: "/apps/browser.tapp/index.html",
				},
				{
					title: "Feedback",
					icon: "/fs/apps/system/feedback.tapp/icon.svg",
					src: "https://forms.gle/m664xxmrugWQADQt9",
					proxy: true,
					size: {
						width: 600,
						height: 500,
					},
				},
				{
					title: "Media Viewer",
					icon: "/fs/apps/system/media viewer.tapp/icon.svg",
					src: "/fs/apps/system/media viewer.tapp/index.html",
				},
				{
					title: "Calculator",
					icon: "/fs/apps/system/calculator.tapp/icon.svg",
					src: "/fs/apps/system/calculator.tapp/index.html",
					snapable: false,
					maximizable: false,
					size: {
						width: 338,
						height: 556,
					},
					controls: ["minimize", "close"],
				},
				{
					title: "About",
					icon: "/fs/apps/system/about.tapp/icon.svg",
					src: "/fs/apps/system/about.tapp/index.html",
				},
				{
					title: "Text Editor",
					icon: "/fs/apps/system/text editor.tapp/icon.svg",
					src: "/fs/apps/system/text editor.tapp/index.html",
				},
				{
					title: "Task Manager",
					icon: "/fs/apps/system/task manager.tapp/icon.svg",
					src: "/fs/apps/system/task manager.tapp/index.html",
				},
			],
			pinned_apps: [],
		};
		await Filer.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(startApps));
		await Filer.promises.writeFile("/apps/installed.json", JSON.stringify([]));
		await Filer.promises.mkdir("/apps/anura/");
		const dockPins = [
			{
				title: "Terminal",
				icon: "/fs/apps/system/terminal.tapp/icon.svg",
				isPinnable: true,
				src: "/fs/apps/system/terminal.tapp/index.html",
			},
			{
				title: "Files",
				icon: "/fs/apps/system/files.tapp/icon.svg",
				isPinnable: true,
				src: "/fs/apps/system/files.tapp/index.html",
			},
			{
				title: "Settings",
				icon: "/fs/apps/system/settings.tapp/icon.svg",
				isPinnable: true,
				src: "/fs/apps/system/settings.tapp/index.html",
			},
			{
				title: "Feedback",
				icon: "/fs/apps/system/feedback.tapp/icon.svg",
				proxy: true,
				isPinnable: true,
				src: "https://forms.gle/m664xxmrugWQADQt9",
				size: {
					width: 600,
					height: 500,
				},
			},
		];
		await Filer.promises.writeFile("/system/var/terbium/dock.json", JSON.stringify(dockPins));
		await Filer.promises.mkdir("/system/lib");
		await Filer.promises.mkdir("/system/lib/anura");
		await Filer.promises.mkdir("/system/tmp");

		const recentApps: any[] = [];
		await Filer.promises.writeFile("/system/var/terbium/recent.json", JSON.stringify(recentApps));
	}
	var items: any[] = [];

	if (!(await dirExists(`/home/${user}`))) {
		await Filer.promises.mkdir(`/home/${user}`);
		const userSettings = {
			wallpaper: "/assets/wallpapers/1.png",
			wallpaperMode: "cover",
			animations: true,
			proxy: sessionStorage.getItem("selectedProxy") || "Ultraviolet",
			transport: "Default (Epoxy)",
			wispServer: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`,
			"battery-percent": false,
			accent: "#32ae62",
			times: {
				format: "12h",
				internet: false,
				showSeconds: false,
			},
		};
		await Filer.promises.writeFile(`/home/${user}/settings.json`, JSON.stringify(userSettings));
		await Filer.promises.mkdir(`/home/${user}/desktop`);
		const r2 = [];
		const sysapps: { name: string; config: string; user: string }[] = [];
		apps.forEach(async (app, i) => {
			const name = app.name.toLowerCase();
			var topPos = 0;
			var leftPos = 0;
			if (i % 12 === 0) {
				topPos = 0;
			} else {
				topPos = i % 12;
			}
			if (i < 12) {
				leftPos = 0;
			} else {
				leftPos = 1;
			}
			if (topPos * 66 > window.innerHeight - 130) {
				leftPos = 1.15;
				if (r2.length === 0) {
					topPos = 0;
				} else {
					topPos = r2.length % 12;
				}
				r2.push({
					name: app.name,
				});
			}

			items.push({
				name: app.name,
				item: `/home/${user}/desktop/${name}.lnk`,
				position: {
					custom: false,
					top: topPos,
					left: leftPos,
				},
			});
			await Filer.promises.mkdir(`/apps/system/${name}.tapp`);
			await Filer.promises.writeFile(
				`/apps/system/${name}.tapp/index.json`,
				JSON.stringify({
					name: app.name,
					config: app.config,
					icon: app.config.icon,
				}),
			);
			sysapps.push({
				name: app.name,
				config: `/apps/system/${name}.tapp/index.json`,
				user: "System",
			});
			await Filer.promises.symlink(`/apps/system/${name}.tapp/index.json`, `/home/${user}/desktop/${name}.lnk`);
		});
		await copyfs();
		await Filer.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(items));
		await Filer.promises.writeFile(
			`/apps/user/${user}/files/config.json`,
			JSON.stringify({
				"quick-center": true,
				"sidebar-width": 180,
				drives: {
					"File System": `/home/${user}/`,
				},
				storage: {
					"File System": "storage-device",
					localStorage: "storage-device",
				},
				"open-collapsibles": {
					"quick-center": true,
					drives: true,
				},
				"show-hidden-files": false,
			}),
			"utf8",
		);
		await Filer.promises.writeFile(`/apps/user/${user}/files/davs.json`, JSON.stringify([]));
		await Filer.promises.mkdir(`/apps/user/${user}/browser`);
		await Filer.promises.writeFile(`/apps/user/${user}/browser/favorites.json`, JSON.stringify([]));
		await Filer.promises.writeFile(`/apps/user/${user}/browser/userscripts.json`, JSON.stringify([]));
		await Filer.promises.writeFile("/apps/installed.json", JSON.stringify(sysapps));
		const response = await fetch("/apps/files.tapp/icons.json");
		const dat = await response.json();
		const iconNames = Object.keys(dat["name-to-path"]);
		const icons = Object.values(dat["name-to-path"]);
		var iconArrays: { [key: string]: string } = {};

		await Filer.promises.mkdir("/system/etc/terbium/file-icons");
		iconNames.forEach(async name => {
			iconArrays[name] = `/system/etc/terbium/file-icons/${name}.svg`; // name, path
			const icon = icons[iconNames.indexOf(name)];
			await Filer.promises.writeFile(`/system/etc/terbium/file-icons/${name}.svg`, icon);
		});
		await Filer.promises.writeFile(
			"/system/etc/terbium/file-icons.json",
			JSON.stringify({
				"ext-to-name": dat["ext-to-name"],
				"name-to-path": iconArrays,
			}),
		);
		await Filer.promises.writeFile(
			`/apps/user/${user}/files/quick-center.json`,
			JSON.stringify({
				paths: {
					Desktop: `/home/${user}/desktop`,
					Documents: `/home/${user}/documents`,
					Images: `/home/${user}/images`,
					Videos: `/home/${user}/videos`,
					Music: `/home/${user}/music`,
					Trash: "/system/trash",
				},
			}),
			"utf8",
		);
		const res = await fetch("/apps/terminal.tapp/scripts/info.json");
		const data = await res.json();
		await Filer.promises.writeFile(`/apps/user/${user}/terminal/info.json`, JSON.stringify(data));
	}
}
