import { type Component, createSignal, onMount } from "solid-js";
import hashData from "./hash.json";
import { dirExists, fileExists } from "./sys/types";

const hash = (hashData as { hash: string }).hash;

import paths from "./installer.json";

const Updater: Component = () => {
	const [progress, setProgress] = createSignal(0);
	let statusref!: HTMLParagraphElement;

	async function copyDir(inp: string, dest: string, rn?: boolean) {
		if (rn === true) {
			if (!(await dirExists(dest))) {
				await Filer.fs.promises.mkdir(dest);
			}
		}
		const files = await Filer.fs.promises.readdir(inp);
		const totalFiles = files.length;
		for (const [index, file] of files.entries()) {
			const stats = await Filer.fs.promises.stat(`${inp}/${file}`);
			if (stats.isDirectory()) {
				await Filer.fs.promises.mkdir(`${dest}/${file}`);
				await copyDir(`${inp}/${file}`, `${dest}/${file}`, true);
			} else {
				await Filer.fs.promises.writeFile(`${dest}/${file}`, await Filer.fs.promises.readFile(`${inp}/${file}`, "utf8"));
			}
			statusref.innerText = `Creating a copy of: ${file}...`;
			setProgress(Math.floor(((index + 1) / totalFiles) * 100));
		}
	}

	onMount(() => {
		const main = async () => {
			const sysapps = ["about.tapp", "app store.tapp", "browser.tapp", "calculator.tapp", "feedback.tapp", "files.tapp", "media viewer.tapp", "settings.tapp", "task manager.tapp", "terminal.tapp", "text editor.tapp"];
			if (await dirExists("/system/tmp/terb-upd/")) {
				// @ts-expect-error
				await new Filer.fs.Shell().promises.rm("/system/tmp/terb-upd/", { recursive: true });
			}
			statusref.innerText = "Installing latest version of TB...";
			await Filer.fs.promises.mkdir("/system/tmp/terb-upd/");
			const apps = await Filer.fs.promises.readdir("/apps/system/");
			setProgress(20);
			statusref.innerText = "Creating a backup";
			if (await fileExists("/apps/system/settings.tapp/wisp-servers.json")) {
				await Filer.fs.promises.writeFile("/system/tmp/terb-upd/wisp-servers.json", await Filer.fs.promises.readFile("/apps/system/settings.tapp/wisp-servers.json"));
			} else {
				const stockDat = [
					{ id: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`, name: "Backend" },
					{ id: "wss://wisp.terbiumon.top/wisp/", name: "TB Wisp Instance" },
				];
				await Filer.fs.promises.writeFile("/system/tmp/terb-upd/wisp-servers.json", JSON.stringify(stockDat));
			}
			for (const item of apps) {
				setProgress(prevProgress => prevProgress + 1);
				if (sysapps.includes(item)) {
					await copyDir(`/apps/system/${item}/`, `/system/tmp/terb-upd/${item}.old`, true);
					// @ts-expect-error
					await new Filer.fs.Shell().promises.rm(`/apps/system/${item}/`, { recursive: true });
				} else {
					console.log(`Skipping ${item}...`);
				}
			}
			setProgress(50);
			statusref.innerText = "Updating Terbium...";
			setProgress(0);
			for (const item of paths as string[]) {
				setProgress(prevProgress => prevProgress + 1);
				statusref.innerText = `Installing ${item}...`;
				const isDir = item.toString().endsWith("/");
				if (isDir) {
					try {
						// @ts-expect-error
						await Filer.fs.promises.mkdir(`/apps/system/${item.toString()}`, { recursive: true });
					} catch (err) {
						console.error(err);
					}
				} else {
					const path = `/apps/system/${item.toString()}`;
					const dir = path.substring(0, path.lastIndexOf("/"));
					try {
						if (!(await dirExists(dir))) {
							// @ts-expect-error
							await Filer.fs.promises.mkdir(dir, { recursive: true });
						}
						const res = await fetch(`/apps/${item.toString()}`);
						const data = await res.text();
						await Filer.fs.promises.writeFile(path, data);
					} catch (err) {
						console.error(err);
					}
				}
			}
			await Filer.fs.promises.writeFile("/apps/system/settings.tapp/wisp-servers.json", await Filer.fs.promises.readFile("/system/tmp/terb-upd/wisp-servers.json"));
			await Filer.fs.promises.writeFile("/system/etc/terbium/hash.cache", hash);
			const user = sessionStorage.getItem("currAcc") || JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8")).defaultUser;
			// v2.0-Beta2 update
			if (!(await fileExists("/apps/installed.json"))) {
				statusref.innerText = "Installing Terbium v2.0-Beta2 prerequisites...";
				const insapps = [
					{
						name: "About",
						config: "/apps/system/about.tapp/index.json",
						user: "System",
					},
					{
						name: "App Store",
						config: "/apps/system/app store.tapp/index.json",
						user: "System",
					},
					{
						name: "Calculator",
						config: "/apps/system/calculator.tapp/index.json",
						user: "System",
					},
					{
						name: "Feedback",
						config: "/apps/system/feedback.tapp/index.json",
						user: "System",
					},
					{
						name: "Files",
						config: "/apps/system/files.tapp/index.json",
						user: "System",
					},
					{
						name: "Media Viewer",
						config: "/apps/system/media viewer.tapp/index.json",
						user: "System",
					},
					{
						name: "Settings",
						config: "/apps/system/settings.tapp/index.json",
						user: "System",
					},
					{
						name: "Task Manager",
						config: "/apps/system/task manager.tapp/index.json",
						user: "System",
					},
					{
						name: "Terminal",
						config: "/apps/system/terminal.tapp/index.json",
						user: "System",
					},
					{
						name: "Text Editor",
						config: "/apps/system/text editor.tapp/index.json",
						user: "System",
					},
					{
						name: "Anura File Manager",
						config: "/system/etc/anura/configs/Anura File Manager.json",
						user: "System",
					},
				];
				const startApps = JSON.parse(await Filer.fs.promises.readFile("/system/var/terbium/start.json", "utf8")).system_apps;
				for (const app of startApps) {
					let appName = "";
					let appTitle = "";
					if (typeof app.title === "object" && app.title !== null && "text" in app.title) {
						appTitle = app.title.text;
					} else if (typeof app.title === "string") {
						appTitle = app.title;
					} else if (typeof app.name === "string") {
						appTitle = app.name;
					}
					appName = appTitle?.toLowerCase?.() || "";
					const isSysApp = sysapps.some(s => s.toLowerCase() === appName) || appName === "anura file manager" || appName === "browser";
					const alreadyInstalled = insapps.some(a => a.name?.toLowerCase?.() === appName || a.name?.toLowerCase?.() === appTitle?.toLowerCase?.());
					if (!isSysApp && !alreadyInstalled) {
						let configPath = "/apps/";
						if (app.name) {
							let appDir = `/apps/system/${app.name}/`;
							let configFile = "";
							if (await fileExists(`${appDir}.tbconfig`)) {
								configFile = `${appDir}.tbconfig`;
							} else {
								if (user) {
									appDir = `/apps/user/${user}/${app.name}/`;
								} else {
									appDir = `/apps/user/${JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8")).defaultUser}/${app.name}/`;
								}
								if (await fileExists(`${appDir}.tbconfig`)) {
									configFile = `${appDir}.tbconfig`;
								} else {
									configFile = `${appDir}index.json`;
								}
							}
							if (configFile) {
								configPath = configFile;
							}
						}
						insapps.push({
							name: appTitle,
							config: configPath,
							user: user || "System",
						});
					}
				}
				await Filer.fs.promises.mkdir("/system/etc/anura/configs/");
				await Filer.fs.promises.writeFile("/apps/installed.json", JSON.stringify(insapps));
				await Filer.fs.promises.writeFile("/system/var/terbium/recent.json", JSON.stringify([]));
			}
			if (!(await fileExists(`/apps/user/${user}/browser/favorites.json`))) {
				await Filer.fs.promises.mkdir(`/apps/user/${user}/browser/`);
				await Filer.fs.promises.writeFile(`/apps/user/${user}/browser/favorites.json`, JSON.stringify([]));
				await Filer.fs.promises.writeFile(`/apps/user/${user}/browser/userscripts.json`, JSON.stringify([]));
			}
			setProgress(80);
			statusref.innerText = "Cleaning up...";
			setProgress(95);
			// @ts-expect-error
			await new Filer.fs.Shell().promises.rm("/system/tmp/terb-upd/", { recursive: true });
			setProgress(100);
			statusref.innerText = "Restarting...";
			window.location.reload();
		};
		main();
	});

	return (
		<div class="bg-[#0e0e0e] h-full justify-center items-center flex flex-col lg:h-full md:h-full">
			<img src="/tb.svg" alt="Terbium" class="w-[25%] h-[25%]" />
			<div class="duration-150 flex flex-col justify-center items-center">
				<div class="text-container relative flex flex-col justify-center items-end">
					<div class="bg-linear-to-b from-[#ffffff] to-[#ffffff77] text-transparent bg-clip-text flex flex-col lg:items-center md:items-center sm:items-center">
						<span class="font-[700] lg:text-[34px] md:text-[28px] sm:text-[22px] text-right duration-150">
							<span class="font-[1000] duration-150">Terbium is updating</span>
						</span>
						<br />
						<p>Please DO NOT close this tab</p>
					</div>
				</div>
			</div>
			<p ref={statusref} class="mt-1">
				Downloading Updates...
			</p>
			<div class="relative flex w-[30%] h-3 rounded-full bg-[#00000020] overflow-hidden mt-4">
				<div class="absolute h-full bg-[#50bf66] rounded-full" style={{ width: `${progress()}%` }} />
			</div>
		</div>
	);
};

export default Updater;
