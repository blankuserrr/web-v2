const tb = parent.window.tb;
const tb_island = tb.window.island;
const tb_window = tb.window;
const tb_context_menu = tb.context_menu;
const tb_dialog = tb.dialog;

const appIsland = window.parent.document.querySelector(".app_island");

tb_island.addControl({
	text: "File",
	appname: "Files",
	id: "files_file",
	click: () => {
		const isTrash = document.querySelector(".exp").getAttribute("path") === "/home/trash" ? true : false;
		tb.contextmenu.create({
			x: 6,
			y: appIsland.clientHeight + 12,
			options: [
				isTrash
					? null
					: {
							text: "New File",
							click: async () => {
								try {
									const response = await tb.dialog.Message({
										title: "Enter a name for the new file",
										defaultValue: "",
										onOk: async fileName => {
											const path = document.querySelector(".exp").getAttribute("path");
											const createFile = async (path, fileName) => {
												await Filer.fs.exists(`${path}/${fileName}`, async exists => {
													if (exists) {
														const ask = await tb.dialog.Message({
															title: `This file already exists. Enter a new name for ${fileName}`,
															defaultValue: "",
														});
														if (ask !== undefined && ask !== "") {
															await createFile(path, ask);
														}
													} else {
														const sh = new Filer.fs.Shell();
														await sh.touch(`${path}/${fileName}`, "");
														openPath(path);
													}
												});
											};
											await createFile(path, fileName);
										},
									});
								} catch (error) {
									console.error(error);
								}
							},
						},
				isTrash
					? null
					: {
							text: "New Folder",
							click: async () => {
								const response = await tb.dialog.Message({
									title: "Enter a name for the new folder",
									defaultValue: "",
									onOk: async response => {
										const path = document.querySelector(".exp").getAttribute("path");
										const createUniqueFolder = async (path, folderName, number = null) => {
											const folderPath = `${path}/${folderName}${number !== null ? ` (${number})` : ""}`;
											try {
												await Filer.fs.promises.access(folderPath);
												return createUniqueFolder(path, folderName, number + 1);
											} catch (error) {
												await Filer.fs.promises.mkdir(folderPath);
											}
										};
										await createUniqueFolder(path, response);
										openPath(path);
									},
								});
							},
						},
				isTrash
					? null
					: {
							text: "Upload from Computer",
							click: () => {
								const fauxput = document.createElement("input");
								fauxput.type = "file";
								fauxput.multiple = true;
								fauxput.onchange = async e => {
									for (const file of e.target.files) {
										const content = await file.arrayBuffer();
										const path = document.querySelector(".exp").getAttribute("path");
										const filePath = `${path}/${file.name}`;
										try {
											await Filer.fs.promises.access(filePath);
											await tb.dialog.Message({
												title: `File "${file.name}" already exists`,
												defaultValue: file.name,
												onOk: async newFileName => {
													if (newFileName !== null && newFileName !== "") {
														await Filer.fs.promises.writeFile(`${path}/${newFileName}`, Filer.Buffer.from(content));
													}
												},
											});
										} catch (error) {
											await Filer.fs.promises.writeFile(filePath, Filer.Buffer.from(content));
										}
									}
									openPath(document.querySelector(".nav-input.dir").value);
								};
								fauxput.click();
							},
						},
			],
		});
	},
});

tb_island.addControl({
	text: "View",
	appname: "Files",
	id: "files_view",
	click: () => {
		const options = [
			// {
			//     text: "Settings",
			//     click: () => {
			//         window.tb.window.create({
			//             title: `Settings`,
			//             icon: "/apps/files.tapp/icon.svg",
			//             src: "/apps/files.tapp/settings.tapp/index.html",
			//             controls: ["minimize", "close"]
			//         })
			//     }
			// },
			{
				text: "Go To",
				click: async () => {
					const response = await tb.dialog.Message({
						title: "Enter a name for the new folder",
						defaultValue: "",
						onOk: async response => {
							await Filer.fs.exists(response, async exists => {
								if (exists) openPath(response);
								else {
									tb.dialog.Alert({
										title: "Error",
										message: `Cannot find ${response}. Check your spelling and try again.`,
									});
								}
							});
						},
					});
				},
			},
		];
		tb.contextmenu.create({
			x: 6,
			y: appIsland.clientHeight + 12,
			options: options,
		});
	},
});

tb_island.addControl({
	text: "Empty Trash",
	appname: "Files",
	id: "files-et",
	click: () => {
		emptyTrash();
	},
});

parent.document.querySelector(`[control-id="files-et"]`)?.classList.add("hidden");
