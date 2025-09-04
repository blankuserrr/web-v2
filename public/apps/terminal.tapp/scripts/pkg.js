async function pkg(args) {
	const availableCommands = [
		"pkg <command> -h: Display help for <command>.",
		"pkg install <package-name>: Install an app matching <package-name> from the repo.",
		"pkg remove <package-name>: Uninstall an app matching <package-name> from the repo.",
		"pkg update: <package-name>: Update a package to the latest version if available.",
		"pkg list: Shows a list of installed apps.",
		"pkg search <package-name>: Search for an app matching <package-name> in the repo.",
		"pkg repo: Changes the Package Managers Fetch repo (Use -r to remove the repo you added)",
	];
	switch (args._[0]) {
		case "install":
			if (args._[1]) {
				const response = await tb.libcurl.fetch(localStorage.getItem("appRepo") || "https://raw.githubusercontent.com/TerbiumOS/app-repo/main/apps.json");
				const repoData = await response.json();
				const packageName = args._[1];
				const exactMatch = repoData.find(pkg => pkg.name.toLowerCase() === packageName);
				if (exactMatch) {
					displayOutput(`Installing ${exactMatch.name}...`);
					const installed = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
					let type;
					if ("pkg-download" in exactMatch) {
						type = "TAPP";
					} else if ("anura-pkg" in exactMatch) {
						type = "anura";
					} else {
						type = "web";
					}
					if (installed.some(app => app.name.toLowerCase() === exactMatch.name.toLowerCase())) {
						displayOutput(`The app "${exactMatch.name}" is already installed.`);
						displayOutput("Do you want to reinstall it? (y/n)");
						term.write("\r\n> ");
						const onData = async input => {
							const userInput = input.trim().toLowerCase();
							if (userInput === "y") {
								displayOutput("");
								displayOutput(`Reinstalling ${exactMatch.name}...`);
								await installApp(exactMatch, type, installed);
								displayOutput(`${exactMatch.name} reinstalled successfully!`);
								createNewCommandInput();
							} else {
								createNewCommandInput();
							}
							disposable.dispose();
						};
						const disposable = term.onData(onData);
						return;
					}
					await installApp(exactMatch, type, installed);
					displayOutput(`${exactMatch.name} installed successfully!`);
					createNewCommandInput();
					return;
				}
				displayOutput(`No package found with the name "${packageName}".`);
				createNewCommandInput();
				return;
			}
			displayOutput("Usage: pkg install <package-name>");
			createNewCommandInput();
			return;
		case "remove":
			if (args._[1]) {
				const packageName = args._[1];
				const installed = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
				const appIndex = installed.findIndex(app => app.name.toLowerCase() === packageName);
				if (appIndex !== -1) {
					const app = installed[appIndex];
					installed.splice(appIndex, 1);
					await Filer.fs.promises.writeFile("/apps/installed.json", JSON.stringify(installed, null, 2), "utf8");
					displayOutput(`Uninstalling ${app.name}...`);
					const configPath = app.config;
					console.log(configPath);
					if (configPath.endsWith("index.json")) {
						const webApps = JSON.parse(await Filer.fs.promises.readFile("/apps/web_apps.json", "utf8"));
						const waIndex = webApps.findIndex(webApp => webApp.name.toLowerCase() === app.name.toLowerCase());
						if (waIndex !== -1) {
							webApps.splice(waIndex, 1);
							await Filer.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(webApps, null, 2), "utf8");
							await tb.launcher.removeApp(app.name);
							displayOutput(`${app.name} has been uninstalled.`);
						}
					} else if (configPath.endsWith("manifest.json")) {
						await Filer.fs.promises.unlink(`/system/etc/anura/configs/${app.name}.json`);
						await tb.sh.rm(configPath.replace("/manifest.json", "/"));
						await tb.launcher.removeApp(app.name);
						displayOutput(`${app.name} has been uninstalled.`);
					} else if (configPath.endsWith(".tbconfig")) {
						await tb.sh.rm(configPath.replace("/.tbconfig", "/"));
						await tb.launcher.removeApp(app.name);
						displayOutput(`${app.name} has been uninstalled.`);
					}
				} else {
					displayOutput(`No installed app found with the name "${packageName}".`);
				}
				createNewCommandInput();
			} else {
				displayOutput("Usage: pkg remove <package-name>");
				createNewCommandInput();
			}
			break;
		case "update":
			if (args._[1]) {
				displayOutput("Checking for updates...");
				const config = JSON.parse(await Filer.fs.promises.readFile(`/apps/system/${args._[1].toLowerCase()}.tapp/.tbconfig`, "utf8"));
				const response = await tb.libcurl.fetch(localStorage.getItem("appRepo") || "https://raw.githubusercontent.com/TerbiumOS/app-repo/main/apps.json");
				const repoData = await response.json();
				const packageName = args._[1];
				const exactMatch = repoData.find(pkg => pkg.name.toLowerCase() === packageName);
				if (config.version !== exactMatch.version) {
					displayOutput(`Updating ${exactMatch.name} from version ${config.version} to ${exactMatch.version}...`);
					await tb.sh.promises.rm(`/apps/system/${args._[1].toLowerCase()}.tapp/`, { recursive: true });
					await installApp(exactMatch, "TAPP");
					displayOutput(`${exactMatch.name} updated successfully!`);
					createNewCommandInput();
				}
			} else {
				displayOutput("Usage: pkg update <package-name>");
				createNewCommandInput();
				return;
			}
			break;
		case "list": {
			displayOutput("Installed Packages for this system:");
			const installed = JSON.parse(await Filer.fs.promises.readFile("/apps/installed.json", "utf8"));
			for (const app of installed) {
				displayOutput(`${app.name} - ${app.user}`);
			}
			displayOutput("");
			displayOutput(`${installed.length} are installed.`);
			createNewCommandInput();
			break;
		}
		case "search":
			if (args._[1]) {
				const response = await tb.libcurl.fetch(localStorage.getItem("appRepo") || "https://raw.githubusercontent.com/TerbiumOS/app-repo/main/apps.json");
				const repoData = await response.json();
				const searchTerm = args._[1].toLowerCase();
				const exactMatch = repoData.find(pkg => pkg.name.toLowerCase() === searchTerm);
				if (exactMatch) {
					displayOutput(`Found package: ${exactMatch.name}`);
				} else {
					const potentialMatches = repoData.filter(pkg => pkg.name.toLowerCase().includes(searchTerm));
					if (potentialMatches.length > 0) {
						displayOutput(`No exact match found for "${searchTerm}".`);
						displayOutput("Did you mean? Potential match(es):");
						for (const match of potentialMatches) {
							displayOutput(`  - ${match.name}`);
						}
					} else {
						displayOutput("No matching packages found.");
					}
				}
				createNewCommandInput();
			} else {
				displayOutput("Usage: pkg search <package-name>");
				createNewCommandInput();
				return;
			}
			break;
		case "repo":
			switch (args._[1]) {
				case "r":
				case "remove":
					displayOutput("Changed Repository URL to the default repo");
					localStorage.removeItem("appRepo");
					createNewCommandInput();
					break;
				case "a":
				case "add":
					displayOutput("Changed Repository URL to: " + args._[2]);
					localStorage.setItem("appRepo", args._[2]);
					createNewCommandInput();
					break;
				default:
					displayOutput("Usage: pkg repo <a/r> [repo-url]");
					createNewCommandInput();
					break;
			}
			break;
		case "help":
		default:
			displayOutput("TPKG v1.4.0 - June 2025");
			displayOutput("Usage: pkg <command>");
			displayOutput(" ");
			displayOutput("All commands:");
			for (let command in availableCommands) {
				command = availableCommands[command];
				const [cmd, description] = command.split(": ");
				displayOutput(`   ${cmd.padEnd(40)} ${description}`);
			}
			createNewCommandInput();
			break;
	}
}

async function installApp(app, type) {
	switch (type) {
		case "web": {
			const appPath = `/apps/user/${await window.parent.tb.user.username()}/${app.name}`;
			const appIndex = {
				name: app.name,
				icon: app.icon,
				description: app.description,
				authors: app.authors,
				"pkg-name": app["pkg-name"],
				version: app.version,
				images: app.images,
				wmArgs: app.wmArgs,
			};
			if (!(await dirExists(appPath))) {
				await Filer.fs.promises.mkdir(appPath);
			}
			await Filer.fs.promises.writeFile(`${appPath}/index.json`, JSON.stringify(appIndex));
			const apps = JSON.parse(await Filer.fs.promises.readFile("/apps/web_apps.json", "utf8"));
			apps["apps"].push(app["pkg-name"]);
			await Filer.fs.promises.writeFile("/apps/web_apps.json", JSON.stringify(apps));
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
			break;
		}
		case "TAPP": {
			const appName = app.name.toLowerCase();
			const DLPath = `/apps/${appName}`;
			const downloadUrl = app["pkg-download"];
			try {
				await tb.system.download(downloadUrl, `${DLPath}.zip`);
				const targetDirectory = `/apps/system/${appName}.tapp/`;
				await unzip(`/apps/${appName}.zip`, targetDirectory);
				const appConf = await Filer.fs.promises.readFile(`/apps/system/${appName}.tapp/.tbconfig`, "utf8");
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
				await Filer.fs.promises.unlink(`${DLPath}.zip`);
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
						JSON.stringify({
							name: appName,
							user: await window.parent.tb.user.username(),
							config: `/apps/system/${appName}.tapp/.tbconfig`,
						}),
					);
				}
			} catch (e) {
				displayError(`Failed to install ${appName} with reason: ${e.message}`);
				return;
			}
			break;
		}
		case "anura": {
			const aName = app.name.toLowerCase();
			const APath = `/apps/anura/${appName}`;
			const aDL = app["anura-pkg"];
			try {
				await tb.system.download(aDL, `${APath}.zip`);
				const targetDirectory = `/apps/anura/${aName}/`;
				await unzip(`/apps/${appName}.zip`, targetDirectory);
				const appConf = await Filer.fs.promises.readFile(`/apps/anura/${aName}/manifest.json`, "utf8");
				const appData = JSON.parse(appConf);
				await window.parent.tb.launcher.addApp({
					name: appData.wininfo.title,
					title: appData.wininfo.title,
					icon: `/fs/apps/anura/${aName}/${appData.icon}`,
					src: `/fs/apps/anura/${aName}/${appData.index}`,
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
				await Filer.fs.promises.unlink(`${APath}.zip`);
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
			} catch (e) {
				displayError(`Failed to install ${appName} with reason: ${e.message}`);
				return;
			}
			break;
		}
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
					displayOutput(`touch ${currentPath.slice(0, -1)}`);
					await Filer.fs.promises.writeFile(currentPath.slice(0, -1), Filer.Buffer.from(content));
				} catch {
					displayOutput(`Cant make ${currentPath.slice(0, -1)}`);
					console.log(`Cant make ${currentPath.slice(0, -1)}`);
				}
			} else if (!(await dirExists(currentPath))) {
				try {
					console.log(`mkdir ${currentPath}`);
					displayOutput(`mkdir ${currentPath}`);
					await Filer.fs.promises.mkdir(currentPath);
				} catch {
					console.log(`Cant make ${currentPath}`);
					displayOutput(`Cant make ${currentPath}`);
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

pkg(args);
