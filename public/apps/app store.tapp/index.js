const Filer = window.Filer;
const ghRepo = localStorage.getItem("appRepo") || "https://raw.githubusercontent.com/TerbiumOS/app-repo/main/apps.json";
async function fetchFromGitHub() {
	const response = await window.parent.tb.libcurl.fetch(ghRepo);
	const apps = response.json();
	return apps;
}

async function otherFetch() {
	const storedRepos = localStorage.getItem("appRepos");
	const repos = storedRepos ? JSON.parse(storedRepos) : [];
	if (!Array.isArray(repos)) {
		console.debug("No Other Repos Detected");
		return [];
	}
	try {
		const apps = await Promise.all(
			repos.map(async repo => {
				const response = await window.parent.tb.libcurl.fetch(repo.url);
				return response.json();
			}),
		);
		const otherapps = [].concat(...apps);
		return otherapps;
	} catch (error) {
		console.error("Error fetching other apps:", error);
		return [];
	}
}

document.querySelector(".details-page .nav-button").addEventListener("click", () => {
	document.querySelector(".appContainer").classList.add("visible");
	document.querySelector(".details-page").classList.remove("visible");
	document.querySelector(".details").innerHTML = "";
});

async function loadApps() {
	const apps = await fetchFromGitHub();
	populateAppCards(apps);
}

async function displayDetails(app) {
	document.querySelector(".appContainer").classList.remove("visible");
	document.querySelector(".details-page").classList.add("visible");
	const header = document.createElement("header");
	const leftpane = document.createElement("div");
	leftpane.classList.add("left");
	const rightpane = document.createElement("div");
	rightpane.classList.add("right");
	header.appendChild(leftpane);
	header.appendChild(rightpane);
	const icon = document.createElement("img");
	icon.classList.add("icon");
	icon.setAttribute("draggable", "false");
	const icn = await window.parent.tb.libcurl.fetch(app.icon);
	const blob = await icn.blob();
	const icnurl = URL.createObjectURL(blob);
	icon.src = icnurl;
	leftpane.appendChild(icon);
	const name = document.createElement("div");
	name.classList.add("name");
	name.innerText = app.name;
	const authors = document.createElement("div");
	authors.classList.add("authors");
	authors.innerText = app.authors;
	const appnameauth = document.createElement("div");
	appnameauth.classList.add("appnameauth");
	appnameauth.appendChild(name);
	appnameauth.appendChild(authors);
	leftpane.appendChild(appnameauth);
	const install = document.createElement("button");
	install.classList.add("install");
	const userName = await window.parent.tb.user.username();
	const pwaExists = await new Promise(resolve => {
		Filer.fs.exists(`/apps/user/${userName}/${app.name}/index.json`, exists => {
			if (exists) {
				resolve(true);
			} else {
				Filer.fs.exists(`/apps/user/${userName}/${app.name}/index.json`, directoryExists => {
					resolve(directoryExists);
				});
			}
		});
	});
	const appExists = await new Promise(resolve => {
		Filer.fs.stat(`/apps/system/${app.name.toLowerCase()}.tapp`, (err, stats) => {
			console.log(err, stats);
			if (err) {
				resolve(false);
			} else {
				resolve(stats.type === "DIRECTORY");
			}
		});
	});
	console.log(appExists);
	const checkupd = async () => {
		if (!app.version) return false;
		console.log("Checking for updates...");
		let conf;
		try {
			conf = await Filer.fs.promises.readFile(`/apps/system/${app["pkg-name"]}/.tbconfig`, "utf8");
		} catch (err) {
			console.log("Up to date or an error occured");
			return false;
		}
		const config = JSON.parse(conf);
		if (config.version !== app.version) {
			console.log(`Update found: ${app.version} your on: ${config.version}`);
			return true;
		}
		return false;
	};
	const upd = await checkupd();
	if (upd === true) {
		install.innerText = "Update";
	} else if (appExists || pwaExists) {
		install.innerText = "Uninstall";
	} else {
		install.innerText = "Install";
	}
	install.addEventListener("click", () => installApp(app));
	rightpane.appendChild(install);
	document.querySelector(".details").appendChild(header);
	const appinfo = document.createElement("div");
	appinfo.classList.add("appinfo");
	document.querySelector(".details").appendChild(appinfo);
	if (app.images) {
		const images = document.createElement("div");
		images.classList.add("app-images");
		appinfo.appendChild(images);
		const left = document.createElement("button");
		left.classList.add("left", "scroll-button", "hidden");
		left.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clip-rule="evenodd" />
            </svg>
        `;
		const right = document.createElement("button");
		right.classList.add("right", "scroll-button", "hidden");
		right.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clip-rule="evenodd" />
            </svg>
        `;
		images.appendChild(left);
		images.appendChild(right);
		const imagesContainer = document.createElement("div");
		imagesContainer.classList.add("images-container", "flex", "gap-2");
		app.images.forEach(async image => {
			const img = document.createElement("img");
			const icn = await window.parent.tb.libcurl.fetch(image);
			const blob = await icn.blob();
			const icnurl = URL.createObjectURL(blob);
			img.src = icnurl;
			imagesContainer.appendChild(img);
		});
		images.appendChild(imagesContainer);
		let scroll = 0;
		left.addEventListener("click", () => {
			scroll -= 1;
			images.scrollLeft -= images.offsetWidth;
		});
		right.addEventListener("click", () => {
			scroll += 1;
			images.scrollLeft += images.offsetWidth;
		});
		images.addEventListener("scroll", () => {
			if (images.scrollLeft === 0) {
				left.classList.add("hidden");
			} else {
				left.classList.remove("hidden");
			}
			if (images.scrollLeft === images.scrollWidth - images.offsetWidth) {
				right.classList.add("hidden");
			} else {
				right.classList.remove("hidden");
			}
			scroll = Math.round(images.scrollLeft / images.offsetWidth);
		});
		const allImages = images.querySelectorAll("img").length;
		let loadedImgs = 0;
		images.querySelectorAll("img").forEach((img, index) => {
			img.addEventListener("load", () => {
				loadedImgs += 1;
				if (loadedImgs === allImages) {
					if (images.scrollWidth > images.offsetWidth) {
						right.classList.remove("hidden");
					}
				}
			});
		});
		images.addEventListener("wheel", e => {
			if (e.deltaY > 0) {
				scroll += 1;
				images.scrollLeft += images.offsetWidth;
			} else {
				scroll -= 1;
				images.scrollLeft -= images.offsetWidth;
			}
		});
	}
	const description = document.createElement("div");
	description.classList.add("description");
	description.innerText = app.description;
	appinfo.appendChild(description);
	if (app.version) {
		const version = document.createElement("div");
		version.classList.add("version");
		version.innerText = "Version: " + app.version;
		appinfo.appendChild(version);
	}
}

async function createAppCard(app) {
	const appCard = document.createElement("div");
	appCard.classList.add("app-card", "flex", "gap-2", "p-3", "w-[242px]", "h-[80px]", "duration-150", "select-none", "cursor-pointer", "rounded-xl", "bg-[#00000028]");
	const description = app.description;
	const icn = await window.parent.tb.libcurl.fetch(app.icon);
	const blob = await icn.blob();
	const icnurl = URL.createObjectURL(blob);
	appCard.innerHTML = `
        <img class="size-12" draggable="false" src="${icnurl}" alt="App Icon">
        <div class="datails">
            <div class="text-base font-bold leading-none">${app.name}</div>
            <div class="text-balance text-sm" title="${description}">${description.substring(0, 35) + "..."}</div>
        </div>
    `;
	appCard.addEventListener("click", () => {
		displayDetails(app);
	});
	return appCard;
}

async function populateAppCards(filteredApps) {
	const appContainer = document.querySelector(".appContainer");
	appContainer.innerHTML = "";
	const appCards = await Promise.all(
		filteredApps.map(async app => {
			return await createAppCard(app);
		}),
	);
	appCards.forEach(appCard => {
		appContainer.appendChild(appCard);
	});
}

function addOtherCards(filteredApps) {
	const repoContainer = document.querySelector(".otherrepos");
	repoContainer.innerHTML = "";
	const appsByRepo = filteredApps.reduce((acc, app) => {
		const repoName = app.repoName || "Unknown Repo";
		if (!acc[repoName]) {
			acc[repoName] = [];
		}
		acc[repoName].push(app);
		return acc;
	}, {});
	for (const [repoName, apps] of Object.entries(appsByRepo)) {
		const repoHeader = document.createElement("h3");
		repoHeader.textContent = repoName;
		repoContainer.appendChild(repoHeader);

		apps.forEach(app => {
			const appCard = createAppCard(app);
			repoContainer.appendChild(appCard);
		});
		const hr = document.createElement("hr");
		repoContainer.appendChild(hr);
	}
}

async function searchApps() {
	if (!document.querySelector(".appContainer").classList.contains("visible")) {
		document.querySelector(".appContainer").classList.add("visible");
		document.querySelector(".details-page").classList.remove("visible");
		document.querySelector(".details").innerHTML = "";
	}
	const apps = await fetchFromGitHub();
	const searchInput = window.parent.document.querySelector(".app-search");
	const searchTerm = searchInput.value.toLowerCase();
	const filteredApps = apps.filter(app => {
		const nameMatches = app.name.toLowerCase().includes(searchTerm);
		const descriptionMatches = app.description.toLowerCase().includes(searchTerm);
		let authors;
		let authorsMatch;
		if (app.authors) {
			authors = Array.isArray(app.authors) ? app.authors : [app.authors];
			authorsMatch = authors.some(author => author.toLowerCase().includes(searchTerm));
			return nameMatches || descriptionMatches || authorsMatch;
		}
		let keywords;
		let keywordsMatch;
		if (app.keywords) {
			keywords = Array.isArray(app.keywords) ? app.keywords : [app.keywords];
			keywordsMatch = keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
			return nameMatches || descriptionMatches || keywordsMatch;
		}
		if (app.authors && app.keywords) {
			authors = Array.isArray(app.authors) ? app.authors : [app.authors];
			keywords = Array.isArray(app.keywords) ? app.keywords : [app.keywords];
			authorsMatch = authors.some(author => author.toLowerCase().includes(searchTerm));
			keywordsMatch = keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
			return nameMatches || descriptionMatches || authorsMatch || keywordsMatch;
		}
		return nameMatches || descriptionMatches;
	});
	populateAppCards(filteredApps);
}

window.addEventListener("DOMContentLoaded", event => {
	window.parent.document.querySelector(".app-search").addEventListener("input", searchApps);
	document.querySelector(".appContainer").classList.add("visible");
	loadApps();
});

async function installApp(app) {
	if ("pkg-download" in app) {
		const appName = app.name.toLowerCase();
		const appPath = `/apps/system/${appName}`;
		const appExists = await new Promise(resolve => {
			Filer.fs.stat(`${appPath}.tapp`, (err, stats) => {
				if (err) {
					if (err.code === "ENOENT") {
						resolve(false);
					}
				} else {
					const exists = stats.type === "DIRECTORY";
					resolve(exists);
				}
			});
		});
		if (!appExists && document.querySelector(".install").innerText === "Install") {
			const downloadUrl = app["pkg-download"];
			console.log(downloadUrl);
			window.parent.tb.notification.Installing({
				message: `Installing ${appName}...`,
				application: "Files",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 500,
			});
			try {
				await window.parent.tb.system.download(downloadUrl, `${appPath}.zip`);
				const targetDirectory = `/apps/system/${appName}.tapp/`;
				await unzip(`${appPath}.zip`, targetDirectory);
				const appConf = await Filer.fs.promises.readFile(`/apps/system/${appName}.tapp/.tbconfig`, "utf8");
				const appData = JSON.parse(appConf);
				console.log(appData);
				await window.parent.tb.launcher.addApp({
					title:
						typeof appData.wmArgs.title === "object"
							? {
									text: appData.wmArgs.title.text,
									weight: appData.wmArgs.title.weight,
									html: appData.wmArgs.title.html,
								}
							: appData.wmArgs.title,
					name: appData.title,
					icon: `/fs/apps/system/${appName}.tapp/${appData.icon}`,
					src: `/fs/apps/system/${appName}.tapp/${appData.wmArgs.src}`,
					size: {
						width: appData.wmArgs.size.width,
						height: appData.wmArgs.size.height,
					},
					single: appData.wmArgs.single,
					resizable: appData.wmArgs.resizable,
					controls: appData.wmArgs.controls,
					message: appData.wmArgs.message,
					snapable: appData.wmArgs.snapable,
				});
				try {
					const apps = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
					apps.push({
						name: appName,
						user: await window.parent.tb.user.username(),
						config: `/apps/system/${appName}.tapp/.tbconfig`,
					});
					await Filer.fs.promises.writeFile("/apps/installed.json", JSON.stringify(apps));
				} catch {
					await Filer.fs.promises.writeFile(
						"/apps/installed.json",
						JSON.stringify([
							{
								name: appName,
								user: await window.parent.tb.user.username(),
								config: `/apps/system/${appName}.tapp/.tbconfig`,
							},
						]),
					);
				}
				window.parent.tb.notification.Toast({
					message: `${appName} has been installed!`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
				await Filer.fs.promises.unlink(`/apps/system/${appName}.zip`);
				document.querySelector(".install").innerText = "Uninstall";
			} catch (e) {
				console.error("Error installing the app:", e);
				await new Filer.fs.Shell().promises.rm(`/apps/system/${appName}.tapp`, { recursive: true });
				window.parent.tb.notification.Toast({
					message: `Failed to install ${appName}. Check the console for details.`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
			}
		} else if (document.querySelector(".install").innerText === "Update") {
			console.log("Update");
			await Filer.fs.promises.readdir(appPath, async (err, files) => {
				if (err) {
					console.error(err);
					return;
				}
				if (files.length > 0) {
					await new Filer.fs.Shell().promises.rm(appPath, { recursive: true });
				} else {
					await new Filer.fs.Shell().promises.rm(appPath, { recursive: true });
				}
			});
			const downloadUrl = app["pkg-download"];
			console.log(downloadUrl);
			window.parent.tb.notification.Installing({
				message: `Updating ${appName}...`,
				application: "Files",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 500,
			});
			try {
				await window.parent.tb.system.download(downloadUrl, `${appPath}.zip`);
				const targetDirectory = `/apps/system/${appName}.tapp/`;
				await unzip(`${appPath}.zip`, targetDirectory);
				console.log("Done!");
				const appConf = await Filer.fs.promises.readFile(`/apps/system/${appName}.tapp}/.tbconfig`, "utf8");
				const appData = JSON.parse(appConf);
				await window.parent.tb.launcher.addApp({
					title:
						typeof appData.wmArgs.title === "object"
							? {
									text: appData.wmArgs.title.text,
									weight: appData.wmArgs.title.weight,
									html: appData.wmArgs.title.html,
								}
							: appData.wmArgs.title,
					name: appData.title,
					icon: `/fs/apps/system/${appName}.tapp/${appData.icon}`,
					src: `/fs/apps/system/${appName}.tapp/${appData.wmArgs.src}`,
					size: {
						width: appData.wmArgs.size.width,
						height: appData.wmArgs.size.height,
					},
					single: appData.wmArgs.single,
					resizable: appData.wmArgs.resizable,
					controls: appData.wmArgs.controls,
					message: appData.wmArgs.message,
					snapable: appData.wmArgs.snapable,
				});
				window.parent.tb.notification.Toast({
					message: `${appName} has been updated!`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
				await Filer.fs.promises.unlink(`${appPath}.zip`);
				document.querySelector(".install").innerText = "Uninstall";
			} catch (e) {
				console.error("Error installing the app:", e);
				await new Filer.fs.Shell().promises.rm(`/apps/${appName}`, { recursive: true });
				window.parent.tb.notification.Toast({
					message: `Failed to install ${appName}. Check the console for details.`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
			}
		} else if (appExists && document.querySelector(".install").innerText === "Uninstall") {
			const appPath = `/apps/system/${appName}.tapp`;
			await new Filer.fs.Shell().promises.rm(appPath, { recursive: true });
			await window.parent.tb.launcher.removeApp(appName);
			try {
				let installedApps = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
				installedApps = installedApps.filter(app => app.name !== appName);
				await Filer.fs.promises.writeFile("/apps/installed.json", JSON.stringify(installedApps));
			} catch (e) {
				console.error(`Error updating installed.json: ${e}`);
			}
			window.parent.tb.notification.Toast({
				message: `${appName} has been uninstalled!`,
				application: "App Store",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 5000,
			});
			document.querySelector(".install").innerText = "Install";
		}
	} else if ("anura-pkg" in app) {
		const appName = app.name.toLowerCase();
		const appPath = `/apps/anura/${appName}`;
		const appExists = await new Promise(resolve => {
			Filer.fs.stat(appPath, (err, stats) => {
				if (err) {
					if (err.code === "ENOENT") {
						resolve(false);
					} else {
						console.error(err);
						resolve(false);
					}
				} else {
					const exists = stats.type === "FILE";
					resolve(exists);
				}
			});
		});
		if (!appExists) {
			const downloadUrl = app["anura-pkg"];
			console.log(downloadUrl);
			window.parent.tb.notification.Installing({
				message: `Installing ${appName}...`,
				application: "Files",
				iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
				time: 500,
			});
			try {
				await window.parent.tb.system.download(downloadUrl, `${appPath}.zip`);
				const targetDirectory = `/apps/anura/${appName}/`;
				await unzip(`/apps/anura/${appName}.zip`, targetDirectory);
				console.log("Done!");
				const appConf = await Filer.fs.promises.readFile(`/apps/anura/${appName}/manifest.json`, "utf8");
				const appData = JSON.parse(appConf);
				console.log(appData);
				await window.parent.tb.launcher.addApp({
					name: appData.wininfo.title,
					title: appData.wininfo.title,
					icon: `/fs/apps/anura/${appName}/${appData.icon}`,
					src: `/fs/apps/anura/${appName}/${appData.index}`,
					size: {
						width: appData.wininfo.width,
						height: appData.wininfo.height,
					},
					single: appData.wininfo.allowMultipleInstance,
				});
				window.parent.anura.apps[appData.package] = {
					title: appData.name,
					icon: appData.icon,
					id: appData.package,
				};
				try {
					const apps = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
					apps.push({
						name: appData.name,
						user: await window.parent.tb.user.username(),
						config: `/apps/anura/${appName}/manifest.json`,
					});
					await Filer.fs.promises.writeFile("/apps/installed.json", JSON.stringify(apps));
				} catch {
					await Filer.fs.promises.writeFile(
						"/apps/installed.json",
						JSON.stringify([
							{
								name: appData.name,
								user: await window.parent.tb.user.username(),
								config: `/apps/anura/${appName}/manifest.json`,
							},
						]),
					);
				}
				window.parent.tb.notification.Toast({
					message: `${appName} has been installed!`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
				await Filer.fs.promises.unlink(`/apps/anura/${appName}.zip`);
				document.querySelector(".install").innerText = "Uninstall";
			} catch (e) {
				console.error("Error installing the app:", e);
				await new Filer.fs.Shell().promises.rm(`/apps/anura/${appName}`, { recursive: true });
				window.parent.tb.notification.Toast({
					message: `Failed to install ${appName}. Check the console for details.`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
			}
		} else {
			if (document.querySelector(".install")) {
				document.querySelector(".install").innerText = "Install";
			}
			console.log("uninstalled");
			await Filer.fs.promises.readdir(appPath, async (err, files) => {
				if (err) {
					console.error(err);
					return;
				}
				if (files.length > 0) {
					await new Filer.fs.Shell().promises.rm(appPath, { recursive: true });
				} else {
					await new Filer.fs.Shell().promises.rm(appPath, { recursive: true });
				}
			});
			document.querySelector(".install").innerText = "Install";
		}
	} else {
		Filer.fs.exists("/apps/web_apps.json", async exists => {
			if (exists) {
				const data = JSON.parse(await Filer.fs.promises.readFile("/apps/web_apps.json", "utf8"));
				await Filer.fs.exists(`/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`, async exists => {
					const apps = data.apps;
					if (apps.includes(app["pkg-name"].toLowerCase()) || exists) {
						const index = apps.indexOf(app["pkg-name"].toLowerCase());
						apps.splice(index, 1);
						data.apps = apps;
						await Filer.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(data));
						if (typeof app["wmArgs"]["title"] === "object") {
							window.parent.tb.launcher.removeApp(app["wmArgs"]["title"].text);
						} else {
							window.parent.tb.launcher.removeApp(app["wmArgs"]["title"]);
						}
						await new Filer.fs.Shell().promises.rm(`/apps/user/${await window.parent.tb.user.username()}/${app.name}`, { recursive: true });
						try {
							let installedApps = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
							installedApps = installedApps.filter(app => app.name !== appName);
							await Filer.fs.promises.writeFile("/apps/installed.json", JSON.stringify(installedApps));
						} catch (e) {
							console.error(`Error updating installed.json: ${e}`);
						}
						if (document.querySelector(".install")) {
							document.querySelector(".install").innerText = "Install";
						}
					} else {
						apps.push(app["pkg-name"].toLowerCase());
						await Filer.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(data));
						window.parent.tb.notification.Toast({
							message: `${app.name} has been installed!`,
							application: "App Store",
							iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
							time: 5000,
						});
						await window.parent.tb.launcher.addApp({
							title: app["wmArgs"]["title"],
							name: app.name,
							icon: app.icon,
							src: app["wmArgs"]["src"],
							size: {
								width: app["wmArgs"]["size"]["width"],
								height: app["wmArgs"]["size"]["height"],
							},
							single: app["wmArgs"]["single"],
							resizable: app["wmArgs"]["resizable"],
							controls: app["wmArgs"]["controls"],
							message: app["wmArgs"]["message"],
							proxy: app["wmArgs"]["proxy"],
							snapable: app["wmArgs"]["snapable"],
						});
						try {
							const apps = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
							apps.push({
								name: app.name,
								user: await window.parent.tb.user.username(),
								config: `/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`,
							});
							await Filer.fs.promises.writeFile("/apps/installed.json", JSON.stringify(apps));
						} catch {
							await Filer.fs.promises.writeFile(
								"/apps/installed.json",
								JSON.stringify([
									{
										name: app.name,
										user: await window.parent.tb.user.username(),
										config: `/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`,
									},
								]),
							);
						}
						console.log(app["wmArgs"]);
						if (document.querySelector(".install")) {
							document.querySelector(".install").innerText = "Uninstall";
						}
					}
				});
			} else {
				const data = {};
				const apps = [];
				apps.push(app["pkg-name"].toLowerCase());
				data.apps = apps;
				await Filer.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(data));
				window.parent.tb.notification.Toast({
					message: `${app.name} has been installed!`,
					application: "App Store",
					iconSrc: "/fs/apps/system/app store.tapp/icon.svg",
					time: 5000,
				});
				try {
					const apps = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
					apps.push({
						name: app.name,
						user: await window.parent.tb.user.username(),
						config: `/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`,
					});
					await Filer.fs.promises.writeFile("/apps/installed.json", JSON.stringify(apps));
				} catch {
					await Filer.fs.promises.writeFile(
						"/apps/installed.json",
						JSON.stringify({
							name: app.name,
							user: await window.parent.tb.user.username(),
							config: `/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`,
						}),
					);
				}
				await window.parent.tb.launcher.addApp({
					title: app["wmArgs"]["title"],
					name: app.name,
					icon: app.icon,
					src: app["wmArgs"]["src"],
					size: {
						width: app["wmArgs"]["size"]["width"],
						height: app["wmArgs"]["size"]["height"],
					},
					single: app["wmArgs"]["single"],
					resizable: app["wmArgs"]["resizable"],
					controls: app["wmArgs"]["controls"],
					message: app["wmArgs"]["message"],
					snapable: app["wmArgs"]["snapable"],
				});
			}
		});
		Filer.fs.exists(`/apps/user/${await window.parent.tb.user.username()}/${app.name}`, async exists => {
			if (!exists) {
				await Filer.fs.promises.mkdir(`/apps/user/${await window.parent.tb.user.username()}/${app.name}`);
				let data = {};
				data = app;
				await Filer.fs.promises.writeFile(`/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`, JSON.stringify(data));
			} else {
				let data = {};
				data = app;
				await Filer.fs.promises.writeFile(`/apps/user/${await window.parent.tb.user.username()}/${app.name}/index.json`, JSON.stringify(data));
			}
		});
	}
}

async function unzip(path, target) {
	const response = await fetch("/fs/" + path);
	const zipFileContent = await response.arrayBuffer();
	if (!(await dirExists(target))) {
		await Filer.fs.promises.mkdir(target, { recursive: true });
	}
	const compressedFiles = window.parent.tb.fflate.unzipSync(new Uint8Array(zipFileContent));
	for (const [relativePath, content] of Object.entries(compressedFiles)) {
		const fullPath = `${target}/${relativePath}`;
		const pathParts = fullPath.split("/");
		let currentPath = "";
		for (let i = 0; i < pathParts.length; i++) {
			currentPath += pathParts[i] + "/";
			if (i === pathParts.length - 1 && !relativePath.endsWith("/")) {
				try {
					console.log(`touch ${currentPath.slice(0, -1)}`);
					await Filer.fs.promises.writeFile(currentPath.slice(0, -1), Filer.Buffer.from(content));
				} catch {
					console.log(`Cant make ${currentPath.slice(0, -1)}`);
				}
			} else if (!(await dirExists(currentPath))) {
				try {
					console.log(`mkdir ${currentPath}`);
					await Filer.fs.promises.mkdir(currentPath);
				} catch {
					console.log(`Cant make ${currentPath}`);
				}
			}
		}
		if (relativePath.endsWith("/")) {
			try {
				console.log(`mkdir fp ${fullPath}`);
				await Filer.fs.promises.mkdir(fullPath);
			} catch {
				console.log(`Cant make ${fullPath}`);
			}
		}
	}
	return "Done!";
}

const dirExists = async path => {
	return new Promise(resolve => {
		Filer.fs.stat(path, (err, stats) => {
			if (err) {
				if (err.code === "ENOENT") {
					resolve(false);
				} else {
					console.error(err);
					resolve(false);
				}
			} else {
				const exists = stats.type === "DIRECTORY";
				resolve(exists);
			}
		});
	});
};
