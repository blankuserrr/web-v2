import { Anura } from "./Anura";

const channel = new BroadcastChannel("tab");

// send message to all tabs, after a new tab
channel.postMessage("newtab");
let activetab = true;
channel.addEventListener("message", msg => {
	if (msg.data === "newtab" && activetab) {
		// if there's a previously registered tab that can read the message, tell the other tab to kill itself
		channel.postMessage("blackmanthunderstorm");
	}

	if (msg.data === "blackmanthunderstorm") {
		activetab = false;
		//@ts-expect-error
		for (const elm of [...document.children]) {
			elm.remove();
		}
		document.open();
		document.write("you already have an anura tab open");
		document.close();
	}
});

let anura: Anura;
// global

window.addEventListener("load", async () => {
	await navigator.serviceWorker.register("/anura-sw.js");
	let conf, milestone, instancemilestone;
	const Filer = (window as any).Filer;
	try {
		conf = await (await fetch("/config.json")).json();
		milestone = await (await fetch("/MILESTONE")).text();
		instancemilestone = conf.milestone;

		console.log("writing config??");
		Filer.fs.writeFile("/config_cached.json", JSON.stringify(conf));
	} catch (e) {
		conf = JSON.parse(await new Promise(r => Filer.fs.readFile("/config_cached.json", (_: any, b: Uint8Array) => r(new TextDecoder().decode(b)))));
	}

	anura = await Anura.new(conf);
	if (milestone) {
		const stored = anura.settings.get("milestone");
		if (!stored) await anura.settings.set("milestone", milestone);
		else if (stored != milestone || anura.settings.get("instancemilestone") != instancemilestone) {
			await anura.settings.set("milestone", milestone);
			await anura.settings.set("instancemilestone", instancemilestone);
			navigator.serviceWorker.controller!.postMessage({
				anura_target: "anura.cache.invalidate",
			});
			console.log("invalidated cache");
			window.location.reload();
		}
	}

	(window as any).anura = anura;

	if (!anura.settings.get("directories")) {
		const defaultDirectories = {
			apps: "/apps/anura/",
			libs: "/system/lib/anura/",
			init: "/system/etc/anura/init/",
			bin: "/system/bin/anura/",
		};
		await anura.settings.set("directories", defaultDirectories);
	}

	if (!anura.settings.get("handler-migration-complete")) {
		// Convert legacy file handlers
		// This is a one-time migration
		const extHandlers = anura.settings.get("FileExts") || {};

		console.log("migrating file handlers");
		console.log(extHandlers);

		for (const ext in extHandlers) {
			const handler = extHandlers[ext];
			if (handler.handler_type === "module") continue;
			if (handler.handler_type === "cjs") continue;
			if (typeof handler === "string") {
				if (handler === "/public/apps/libfileview.app/fileHandler.js") {
					extHandlers[ext] = {
						handler_type: "module",
						id: "anura.fileviewer",
					};
					continue;
				}
				extHandlers[ext] = {
					handler_type: "cjs",
					path: handler,
				};
			}
		}
		anura.settings.set("FileExts", extHandlers);
		anura.settings.set("handler-migration-complete", true);
	}

	setTimeout(
		() => {
			anura.logger.debug("boot completed");
			document.dispatchEvent(new Event("anura-boot-completed"));
		},
		anura.settings.get("oobe-complete") ? 1000 : 2000,
	);
});

document.addEventListener("anura-boot-completed", async () => {
	// Anura OOBE code used to be here
	anura.settings.set("handler-migration-complete", true);
});

document.addEventListener("anura-login-completed", async () => {
	for (const app of anura.config.apps) {
		anura.registerExternalApp(app);
	}

	for (const lib of anura.config.libs) {
		anura.registerExternalLib(lib);
	}

	// Load all persistent sideloaded apps
	try {
		// @ts-expect-error
		anura.fs.readdir("/apps/anura", (err: Error, files: string[]) => {
			// Fixes a weird edgecase that I was facing where no user apps are installed, nothing breaks it just throws an error which I would like to mitigate.
			if (files == undefined) return;
			files.forEach(file => {
				try {
					anura.registerExternalApp("/fs/apps/anura/" + file);
				} catch (e) {
					anura.logger.error("Anura failed to load an app " + e);
				}
			});
		});
	} catch (e) {
		anura.logger.error(e);
	}
	// Load all user provided init scripts
	try {
		// @ts-expect-error
		anura.fs.readdir("/userInit", (err: Error, files: string[]) => {
			// Fixes a weird edgecase that I was facing where no user apps are installed, nothing breaks it just throws an error which I would like to mitigate.
			if (files == undefined) return;
			files.forEach(file => {
				try {
					anura.fs.readFile(
						"/userInit/" + file,
						// @ts-expect-error
						(err: Error, data: Uint8Array) => {
							if (err) throw "Failed to read file";
							try {
								eval(new TextDecoder("utf-8").decode(data));
							} catch (e) {
								console.error(e);
							}
						},
					);
				} catch (e) {
					anura.logger.error("Anura failed to load an app " + e);
				}
			});
		});
	} catch (e) {
		anura.logger.error(e);
	}
	if ((await await fetch("/fs/")).status === 404) {
		anura.notifications.add({
			title: "Anura Error",
			description: "Anura has encountered an error with the Filesystem HTTP bridge, click this notification to restart",
			timeout: 50000,
			callback: () => window.location.reload(),
		});
	}

	document.addEventListener("contextmenu", e => {
		if (e.shiftKey) return;
		e.preventDefault();
		//     const menu: any = document.querySelector(".custom-menu");
		//     menu.style.removeProperty("display");
		//     menu.style.top = `${e.clientY}px`;
		//     menu.style.left = `${e.clientX}px`;
	});
	//
	// document.addEventListener("click", (e) => {
	//     if (e.button != 0) return;
	//     (
	//         document.querySelector(".custom-menu")! as HTMLElement
	//     ).style.setProperty("display", "none");
	// });

	anura.initComplete = true;
});
