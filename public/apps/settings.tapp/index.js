const Filer = window.Filer;
const tb = parent.window.tb;
const tb_window = tb.window;
const tb_desktop = tb.desktop;
const tb_preferences = tb.desktop.preferences;
const tb_island = tb.window.island;
const tb_context_menu = tb.context_menu;
const tb_dialog = tb.dialog;
const tb_wallpaper = parent.window.tb.desktop.wallpaper;
const parent_body = parent.document.body;
setInterval(() => {
	if (parent_body.getAttribute("theme")) document.body.setAttribute("theme", parent_body.getAttribute("theme"));
});

const cat_options = document.querySelectorAll(".cat-option");
cat_options.forEach(option => {
	function mouseleave() {
		const tooltip = option.querySelector(".cat-tooltip");
		tooltip.classList.add("hidden");
		option.removeEventListener("mouseleave", mouseleave);
		option.addEventListener("mouseover", mouseover);
	}
	function mouseover() {
		setTimeout(() => {
			if (option.matches(":hover")) {
				if (option.offsetWidth === 36) {
					const tooltip = option.querySelector(".cat-tooltip");
					tooltip.classList.remove("hidden");
					document.querySelectorAll(".cat-tooltip").forEach(tooltip => {
						if (tooltip !== option.querySelector(".cat-tooltip")) tooltip.classList.add("hidden");
					});
					option.addEventListener("mouseleave", mouseleave);
				}
			}
		}, 1000);
	}
	option.addEventListener("click", e => {
		const cat = option.getAttribute("data-category");
		const current_cat = document.querySelector('.settings-category[data-visible="true"]').getAttribute("category");
		if (cat === current_cat) return;
		document.querySelectorAll(".settings-category").forEach(category => {
			category.dataset.visible = "false";
			category.classList.add("opacity-0", "pointer-events-none", "translate-y-6");
		});
		document.querySelectorAll(".cat-option").forEach(opt => opt.classList.remove("selected"));
		const view = document.querySelector(`.settings-category[category="${cat}"]`);
		if (view === null) return;
		view.dataset.visible = "true";
		view.classList.remove("opacity-0", "pointer-events-none", "translate-y-6");
		option.classList.add("selected");
	});
	option.addEventListener("mouseover", mouseover);
});

const wallpaper_options = document.querySelectorAll(".wallpaper-option");
wallpaper_options.forEach(option => {
	option.addEventListener("click", async e => {
		const parent_origin = parent.parent.window.location.origin;
		const wallpaper = option.src.toString().split(parent_origin)[1];
		const color = option.getAttribute("color-type");
		const data = JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
		data["wallpaper"] = wallpaper;
		tb_wallpaper.set(wallpaper);
		const fillMode = parent.window.tb.desktop.wallpaper.fillMode();
		if (fillMode === null) parent.window.tb.desktop.wallpaper.cover();
		if (color !== parent.window.tb.desktop.preferences.theme()) {
			// parent.window.tb.desktop.preferences.setTheme(`${color`)
			document.body.setAttribute("theme", color);
		}
	});
});

Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	const fillMode = data["wallpaperMode"];
	const showSeconds = data["times"]["showSeconds"];
	const twentyFourHour = data["times"]["format"];
	const fillModeCapitalized = fillMode.charAt(0).toUpperCase() + fillMode.slice(1);
	document.querySelector(`[action-for="wallpaper-fill"]`).querySelector(".select-title .text").innerText = fillModeCapitalized;
	document.querySelector(`[action-for="proxy"]`).querySelector(".select-title .text").innerText = data["proxy"];
	document.querySelector(`[action-for="transports"]`).querySelector(".select-title .text").innerText = data["transport"];
	document.querySelector(`[action-for="show-seconds"]`).querySelector(".select-title .text").innerText = showSeconds ? "Yes" : "No";
	document.querySelector(`[action-for="24h-12h"]`).querySelector(".select-title .text").innerText = twentyFourHour === "24h" ? "Yes" : "No";
});

Filer.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	const cords = data["location"];
	document.querySelector(".cords").innerText = `${cords}`;
	const tempunit = data["weather"]["unit"];
	document.querySelector(`[action-for="temperature-unit"]`).querySelector(".select-title .text").innerText = tempunit;
});

const customWallpaper = () => {
	const input = document.createElement("input");
	input.type = "file";
	input.setAttribute("accept", "image/*");
	input.click();
	input.addEventListener("change", async e => {
		const file = input.files[0];
		const buffer = await file.arrayBuffer();
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = async () => {
			const imgdata = reader.result;
			const path = "/system/etc/terbium/wallpapers/" + file.name;

			tb_wallpaper.set(path);
			const img_container = document.createElement("div");
			img_container.classList.add("wallpaper-container");
			const wimg = document.createElement("img");
			wimg.src = imgdata;
			wimg.classList.add("wallpaper-option");

			const delete_button = document.createElement("img");
			delete_button.src = "/fs/apps/system/settings.tapp/delete.svg";
			delete_button.classList.add("delete-wallpaper");
			delete_button.addEventListener("click", async e => {
				const data = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
				if (data["wallpaper"] === path) {
					tb_wallpaper.set("/assets/wallpapers/1.png");
				}
				await Filer.fs.promises.unlink(path);
				img_container.remove();
			});
			wimg.addEventListener("click", async e => {
				tb_wallpaper.set(path);
			});
			await Filer.fs.promises.writeFile(path, Filer.Buffer.from(buffer));
			tb_wallpaper.set(path);
			img_container.append(wimg);
			img_container.append(delete_button);
			document.querySelector(".custom-wallpaper").remove();
			document.querySelector(".wallpapers").append(img_container);
			appendCustomWallpaper();
		};
	});
};

const appendCustomWallpaper = () => {
	if (document.querySelector(".custom-wallpaper")) {
		console.log(document.querySelector(".custom-wallpaper"));
	}

	const newButton = `
        <button class="wallpaper-option flex justify-center items-center bg-[#ffffff10] hover:bg-[#ffffff20] duration-150 custom-wallpaper" style="box-shadow: inset 0 0 0 0.5px #ffffff38;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-8 pointer-events-none">
                <path style="stroke: currentColor; stroke-width: 1;" fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
            </svg>
        </button>
    `;

	const wallpaperContainer = document.querySelector(".wallpapers");
	wallpaperContainer.insertAdjacentHTML("beforeend", newButton);
	const customWallpaperBtn = document.querySelector(".custom-wallpaper");
	customWallpaperBtn.addEventListener("click", e => {
		customWallpaper();
	});
};

async function getWispSrvs() {
	const fileExists = await Filer.fs.promises
		.stat("//apps/system/settings.tapp/wisp-servers.json")
		.then(() => true)
		.catch(() => false);
	if (!fileExists) {
		await Filer.fs.promises.mkdir("//apps/settings.tapp/", { recursive: true });
		const stockDat = [
			{ id: `${location.protocol.replace("http", "ws")}//${location.hostname}:${location.port}/wisp/`, name: "Backend" },
			{ id: "wss://wisp.terbiumon.top/wisp/", name: "TB Wisp Instance" },
		];
		await Filer.fs.promises.writeFile("//apps/system/settings.tapp/wisp-servers.json", JSON.stringify(stockDat));
	}
	const main = document.getElementById("wispSrvs");
	window.parent.window.dispatchEvent(new Event("update-wispsrvs"));
	const makeCard = async (name, id) => {
		const settings = await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8");
		const settdata = JSON.parse(settings);

		const card = document.createElement("div");
		card.classList.add("flex", "justify-between", "w-full", "p-1.5", "rounded-lg", "duration-150");
		if (name === settdata.wispServer) {
			card.classList.add("bg-[#4acd609c]");
		} else {
			card.classList.add("bg-[#ffffff18]", "hover:bg-[#ffffff38]", "cursor-pointer");
		}

		const html = `
            <div class="flex gap-6 items-center justify-between text-[#ffffffd1] w-full pointer-events-none">
                <div class="flex gap-3 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-8">
                        <path fill-rule="evenodd" d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.062 0 8.25 8.25 0 0 0-11.667 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.204 3.182a6 6 0 0 1 8.486 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0 3.75 3.75 0 0 0-5.304 0 .75.75 0 0 1-1.06 0l-.53-.53a.75.75 0 0 1 0-1.06Zm3.182 3.182a1.5 1.5 0 0 1 2.122 0 .75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061 0l-.53-.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                    </svg>
                    <div class="flex flex-col">
                        <h3 class="font-bold leading-tight">${id}</h3>
                        <span class="text-xs leading-tight">${name}</span>
                    </div>
                </div>
                <p latency class="text-sm p-2 bg-[#ffffff38] rounded-lg leading-none text-[#ffffffce] font-extrabold">Pinging...</p>
            </div>
        `;

		card.innerHTML = html;
		setTimeout(async () => {
			const res = await ping(name);
			document.querySelector("[latency]").innerHTML = res.latency + "ms";
		}, 1750);

		card.addEventListener("click", async () => {
			settdata.wispServer = name;
			const updSet = JSON.stringify(settdata, null, 2);
			await Filer.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, updSet);
			window.parent.tb.proxy.updateSWs();
			window.parent.window.dispatchEvent(new Event("update-wispsrvs"));
		});

		main.appendChild(card);
	};
	const data = JSON.parse(await Filer.fs.promises.readFile("//apps/system/settings.tapp/wisp-servers.json"));
	data.forEach(item => {
		makeCard(item.id, item.name);
	});
	const ping = id => {
		return new Promise(resolve => {
			const websocket = new WebSocket(id);
			const startTime = Date.now();
			const onOpen = () => {
				const latency = Date.now() - startTime;
				websocket.close();
				resolve({ status: "OK", latency });
			};
			const onMessage = () => {
				const latency = Date.now() - startTime;
				websocket.close();
				resolve({ status: "OK", latency });
			};
			const onError = () => {
				websocket.close();
				resolve({ status: "Fail", latency: "N/A" });
			};
			websocket.addEventListener("open", onOpen);
			websocket.addEventListener("message", onMessage);
			websocket.addEventListener("error", onError);
			setTimeout(() => {
				websocket.close();
				resolve({ status: "Fail", latency: "N/A" });
			}, 5000);
		});
	};
	const addWispbtn = document.getElementById("addWisp");
	addWispbtn.addEventListener("click", () => {
		window.parent.tb.dialog.Message({
			title: "Enter a name for the Wisp server",
			onOk: async val => {
				sessionStorage.setItem("wispSrv", val);
				window.parent.tb.dialog.Message({
					title: "Enter the socket URL for the Wisp server",
					onOk: async val => {
						const ent = { id: val, name: sessionStorage.getItem("wispSrv") };
						const data = JSON.parse(await Filer.fs.promises.readFile("//apps/system/settings.tapp/wisp-servers.json"));
						data.push(ent);
						Filer.fs.promises.writeFile("//apps/system/settings.tapp/wisp-servers.json", JSON.stringify(data));
						makeCard(val, sessionStorage.getItem("wispSrv"));
					},
				});
			},
		});
	});
}
getWispSrvs();

async function updateTransport(transport) {
	const st = JSON.parse(await window.Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
	st["transport"] = transport;
	await window.Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(st), "utf8");
}

const accentPreview = document.querySelector(".accent-preview");
const accentMousedown = async () => {
	const defaultAccent = "#32ae62";
	accentPreview.classList.remove("group", "cursor-pointer");
	accentPreview.style.setProperty("--accent", defaultAccent);
	const settings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
	settings["accent"] = defaultAccent;
	Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings));
	accentPreview.removeEventListener("mousedown", accentMousedown);
};

const getAccent = async () => {
	const settings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
	var accentColor = settings["accent"];
	const defaultAccent = "#32ae62";
	if (accentColor !== defaultAccent) {
		accentPreview.classList.add("group", "cursor-pointer");
		accentPreview.addEventListener("mousedown", accentMousedown);
	}
	if (accentColor) {
		accentPreview.style.setProperty("--accent", accentColor);
	} else {
		accentPreview.style.setProperty("--accent", "#32ae62");
	}
};
getAccent();

const custom_accent = document.querySelector(".custom-accent");
custom_accent.addEventListener("click", e => {
	const color_picker = document.createElement("input");
	color_picker.type = "color";
	color_picker.click();
	color_picker.addEventListener("change", async e => {
		let color = color_picker.value;
		if (color.charAt(0) !== "#") {
			const rgb = color.match(/\d+/g);
			const r = rgb[0];
			const g = rgb[1];
			const b = rgb[2];
			color = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
			const settings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
			settings["accent"] = color;
			Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings));
		} else {
			const settings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
			settings["accent"] = color;
			Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings));
		}
		accentPreview.style.setProperty("--accent", color);
		accentPreview.classList.add("group", "cursor-pointer");
		accentPreview.addEventListener("mousedown", accentMousedown);
	});
});

const getWallpapers = async () => {
	const files = await Filer.fs.promises.readdir("/system/etc/terbium/wallpapers");
	for (const file of files) {
		const path = "/system/etc/terbium/wallpapers/" + file;
		const data = URL.createObjectURL(new Blob([await Filer.fs.promises.readFile(path, "utf8")]));
		const img_container = document.createElement("div");
		img_container.classList.add("wallpaper-container");
		const img = document.createElement("img");
		img.src = `/fs/${path}`;
		img.classList.add("wallpaper-option");
		const delete_button = document.createElement("img");
		delete_button.src = "/fs/apps/system/settings.tapp/delete.svg";
		delete_button.classList.add("delete-wallpaper");
		delete_button.addEventListener("click", e => {
			Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
				if (err) return console.log(err);
				data = JSON.parse(data);
				if (data["wallpaper"] === path) {
					tb_wallpaper.set("/assets/wallpapers/1.png");
				}
			});
			Filer.fs.unlink(path, err => {
				if (err) return console.log(err);
				img_container.remove();
			});
		});
		img_container.append(img);
		img_container.append(delete_button);
		document.querySelector(".wallpapers").append(img_container);
		img.addEventListener("click", e => {
			tb_wallpaper.set(path);
		});
	}
	appendCustomWallpaper();
};
getWallpapers();

const pfpEl = document.querySelector(".pfp");
Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	pfpEl.src = data["pfp"];
});

pfpEl.addEventListener("click", e => {
	const uploader = document.createElement("input");
	uploader.type = "file";
	uploader.accept = "img/*";
	uploader.onchange = () => {
		const files = uploader.files;
		const file = files[0];
		const reader = new FileReader();
		reader.onload = () => {
			tb.dialog.Cropper({
				title: "Resize your Profile picture",
				img: reader.result,
				onOk: async img => {
					const uSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"));
					uSettings["pfp"] = img;
					pfpEl.src = img;
					await Filer.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(uSettings));
					window.parent.dispatchEvent(new Event("accUpd"));
				},
			});
		};
		reader.readAsDataURL(file);
	};
	uploader.click();
});

const usernameEl = document.querySelector(".username");
usernameEl.addEventListener("input", async e => {
	usernameEl.addEventListener("blur", async () => {
		if (usernameEl.value !== JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"))["username"]) {
			Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8", async (err, data) => {
				if (err) return console.log(err);
				data = JSON.parse(data);
				data["username"] = usernameEl.value;
				await Filer.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(data));
				let desktopDat = JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/desktop/.desktop.json`, "utf8"));
				desktopDat = desktopDat.map(entry => {
					entry.item = entry.item.replace(`/home/${sessionStorage.getItem("currAcc")}/`, `/home/${usernameEl.value}/`);
					return entry;
				});
				await Filer.fs.promises.rename(`/home/${sessionStorage.getItem("currAcc")}`, `/home/${usernameEl.value}`);
				await Filer.fs.promises.writeFile(`/home/${usernameEl.value}/desktop/.desktop.json`, JSON.stringify(desktopDat));
				await Filer.fs.promises.rename(`/apps/user/${sessionStorage.getItem("currAcc")}`, `/apps/user/${usernameEl.value}`);
				Filer.fs.readFile("/system/etc/terbium/settings.json", "utf8", async (err, data) => {
					if (err) return console.log(err);
					data = JSON.parse(data);
					data["defaultUser"] = usernameEl.value;
					await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(data));
				});
				const fcfg = JSON.parse(await Filer.fs.promises.readFile(`/apps/user/${usernameEl.value}/files/config.json`, "utf8"));
				fcfg.drives["File System"] = `/home/${usernameEl.value}/`;
				await Filer.fs.promises.writeFile(`/apps/user/${usernameEl.value}/files/config.json`, JSON.stringify(fcfg));
				const qcfg = JSON.parse(await Filer.fs.promises.readFile(`/apps/user/${usernameEl.value}/files/quick-center.json`, "utf8"));
				for (const key in qcfg.paths) {
					if (Object.hasOwn(qcfg.paths, key)) {
						qcfg.paths[key] = qcfg.paths[key].replace(sessionStorage.getItem("currAcc"), usernameEl.value);
					}
				}
				await Filer.fs.promises.writeFile(`/apps/user/${usernameEl.value}/files/quick-center.json`, JSON.stringify(qcfg));
				sessionStorage.setItem("currAcc", usernameEl.value);
			});
		}
	});
});

const permEl = document.querySelector(".perm");
permEl.addEventListener("click", async () => {
	const data = JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8"));
	if (data["password"] === false) {
		await tb.dialog.Select({
			title: "Enter the permission level you wish to set (Ex: Admin, User, Group, Public)",
			options: [
				{
					text: "Admin",
					value: "admin",
				},
				{
					text: "User",
					value: "user",
				},
				{
					text: "Group",
					value: "group",
				},
				{
					text: "Public",
					value: "public",
				},
			],
			onOk: async perm => {
				if (perm === data["perm"]) return;
				data["perm"] = perm;
				permEl.innerHTML = perm.charAt(0).toUpperCase() + perm.slice(1);
				await Filer.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(data));
			},
		});
	} else {
		await tb.dialog.Auth({
			sudo: true,
			title: "Authenticate to change your permissions",
			defaultUsername: sessionStorage.getItem("currAcc"),
			onOk: async (username, password) => {
				const pass = await tb.crypto(password);
				if (pass === data["password"]) {
					await tb.dialog.Select({
						title: "Enter the permission level you wish to set (Ex: Admin, User, Group, Public)",
						options: [
							{
								text: "Admin",
								value: "admin",
							},
							{
								text: "User",
								value: "user",
							},
							{
								text: "Group",
								value: "group",
							},
							{
								text: "Public",
								value: "public",
							},
						],
						onOk: async perm => {
							if (perm === data["perm"]) return;
							data["perm"] = perm;
							permEl.innerHTML = perm.charAt(0).toUpperCase() + perm.slice(1);
							await Filer.fs.promises.writeFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, JSON.stringify(data));
						},
					});
				} else {
					throw new Error("Incorrect Password");
				}
			},
		});
	}
});

Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/user.json`, "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	usernameEl.value = data["username"];
	permEl.innerHTML = data["perm"].charAt(0).toUpperCase() + data["perm"].slice(1);
});

const hostnameEl = document.querySelector(".hostname");
hostnameEl.addEventListener("input", async e => {
	hostnameEl.addEventListener("blur", async () => {
		if (hostnameEl.value !== JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8"))["host-name"]) {
			Filer.fs.readFile("/system/etc/terbium/settings.json", "utf8", async (err, data) => {
				if (err) return console.log(err);
				data = JSON.parse(data);
				data["host-name"] = hostnameEl.value;
				await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(data));
			});
		}
	});
});

Filer.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
	if (err) return console.log(err);
	data = JSON.parse(data);
	hostnameEl.value = data["host-name"];
});

const cords = document.querySelector(".cords");
const saveCity = document.querySelector(".save-city");
saveCity.addEventListener("click", e => {
	Filer.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
		if (err) return console.log(err);
		data = JSON.parse(data);
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				position => {
					const latitude = position.coords.latitude;
					const longitude = position.coords.longitude;
					console.log(`${latitude},${longitude}`);
					data["location"] = `${latitude},${longitude}`;
					window.parent.dispatchEvent(new Event("updWeather"));
					Filer.fs.writeFile("/system/etc/terbium/settings.json", JSON.stringify(data), err => {
						if (err) return console.log(err);
					});
				},
				error => {
					console.error(`Error Occured: ${error.code}`);
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0,
				},
			);
		}
	});
});

const accountsButton = document.querySelector(".accounts");
accountsButton.addEventListener("mousedown", e => {
	tb_window.create({
		title: "Accounts",
		src: "/fs/apps/system/settings.tapp/accounts/index.html",
		icon: "/fs/apps/system/settings.tapp/accounts/icon.svg",
		size: {
			width: 400,
			height: 500,
		},
	});
});

const batteryPercentage = document.querySelector(".battery-percentage");
(async () => {
	const showBatteryPercentage = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"))["battery-percent"];
	const realCheckbox = batteryPercentage.querySelector("input[type='checkbox']");
	if (showBatteryPercentage) {
		realCheckbox.checked = true;
		const checkIcon = batteryPercentage.querySelector(".checkIcon");
		checkIcon.classList.remove("opacity-0", "scale-85");
	} else {
		realCheckbox.checked = false;
		const checkIcon = batteryPercentage.querySelector(".checkIcon");
		checkIcon.classList.add("opacity-0", "scale-85");
	}
})();

batteryPercentage.addEventListener("mousedown", async e => {
	const data = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
	const realCheckbox = batteryPercentage.querySelector("input[type='checkbox']");
	realCheckbox.checked = !realCheckbox.checked;
	const checkIcon = batteryPercentage.querySelector(".checkIcon");
	if (realCheckbox.checked) {
		checkIcon.classList.remove("opacity-0", "scale-85");
		tb.battery.showPercentage();
	} else {
		checkIcon.classList.add("opacity-0", "scale-85");
		tb.battery.hidePercentage();
	}
	data["battery-percent"] = realCheckbox.checked;
	Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(data));
});

const getBat = async () => {
	const battery = await window.tb.battery.canUse();
	if (!battery) {
		document.querySelector(".battery").remove();
	}
};
getBat();

const showCords = document.querySelector(".showCords");
showCords.addEventListener("mousedown", async e => {
	showCords.classList.add("opacity-0", "pointer-events-none");
	cords.classList.remove("opacity-0");
	const mouseup = () => {
		showCords.classList.remove("opacity-0", "pointer-events-none");
		cords.classList.add("opacity-0");
		document.removeEventListener("mouseup", mouseup);
	};
	document.addEventListener("mouseup", mouseup);
});

async function exportSettings() {
	const settings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
	const data = JSON.stringify(settings);
	const blob = new Blob([data], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "settings.json";
	a.click();
}

async function convertTBSIF() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".tbs";
	input.onchange = async () => {
		const file = input.files[0];
		const reader = new FileReader();
		reader.onload = async () => {
			const tbs_config = reader.result;
			const settings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
			const syssettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`, "utf8"));
			if (tbs_config.theme && tbs_config.theme !== "default") {
				syssettings.theme = tbs_config.theme;
			}
			if (tbs_config.wallpaper && tbs_config.wallpaper !== "default" && settings.wallpaper !== "/assets/wallpapers/1.png") {
				settings.wallpaper = tbs_config.wallpaper;
			}
			if (tbs_config.wallpaperFill && tbs_config.wallpaperFill !== "default") {
				settings.wallpaperMode = tbs_config.wallpaperFill === "contain" ? "cover" : "contain";
			}
			if (tbs_config.shadow === "yes") {
				settings["system-blur"] = true;
			}
			await Filer.fs.promises.writeFile(`/home/${await window.tb.user.username()}/settings.json`, JSON.stringify(settings, null, 2), "utf8");
			await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(syssettings, null, 2), "utf8");
			parent.window.location.reload();
		};
		reader.readAsText(file);
	};
	input.click();
}

const animationCheckbox = document.querySelector(".eruda-check");
const eruda = () => {
	const realCheckbox = animationCheckbox.querySelector("input[type='checkbox']");
	const checkIcon = animationCheckbox.querySelector(".checkIcon");
	const setState = enabled => {
		realCheckbox.checked = enabled;
		if (enabled) {
			checkIcon.classList.remove("opacity-0", "scale-85");
			localStorage.setItem("eruda", "true");
		} else {
			checkIcon.classList.add("opacity-0", "scale-85");
			localStorage.removeItem("eruda");
		}
	};
	setState(localStorage.getItem("eruda") === "true");
	animationCheckbox.addEventListener("mousedown", () => {
		setState(!realCheckbox.checked);
	});
};
eruda();

/*
const animationCheckbox = document.querySelector(".animations-check");
animationCheckbox.addEventListener("mousedown", async (e) => {
    const realCheckbox = animationCheckbox.querySelector("input[type='checkbox']");
    realCheckbox.checked = !realCheckbox.checked;
    const checkIcon = animationCheckbox.querySelector(".checkIcon");
    if(realCheckbox.checked) {
        checkIcon.classList.remove("opacity-0", "scale-85");
    } else {
        checkIcon.classList.add("opacity-0", "scale-85");
    }
})*/
