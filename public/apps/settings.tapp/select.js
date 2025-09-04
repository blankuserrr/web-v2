const selects = document.querySelectorAll(".select");

selects.forEach(select => {
	const intiator = select.querySelector(".select-title");
	const select_options = select.querySelector(".options");

	intiator.addEventListener("click", e => {
		document.querySelectorAll(".options").forEach(option => {
			if (option !== select_options) {
				option.classList.remove("open");
			}
		});
		select_options.classList.toggle("open");
		const options = select_options.querySelectorAll(".option");
		options.forEach(option => {
			option.addEventListener("click", () => {
				intiator.querySelector(".text").innerHTML = option.getAttribute("value");
				select_options.classList.remove("open");
				if (select.getAttribute("action") === "fs") {
					if (select.getAttribute("action-for") === "wallpaper-fill") {
						switch (option.getAttribute("value").toLowerCase()) {
							case "cover":
								tb.desktop.wallpaper.cover();
								break;
							case "contain":
								tb.desktop.wallpaper.contain();
								break;
							case "stretch":
								tb.desktop.wallpaper.stretch();
								break;
						}
					} else if (select.getAttribute("action-for") === "proxy") {
						switch (option.getAttribute("value").toLowerCase()) {
							case "Ultraviolet":
								tb.proxy.set("Ultraviolet");
								break;
							case "Scramjet":
								tb.proxy.set("Scramjet");
								break;
						}
					} else if (select.getAttribute("action-for") === "show-seconds") {
						switch (option.getAttribute("value").toLowerCase()) {
							case "no":
								Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
									if (err) return console.log(err);
									const settings = JSON.parse(data);
									settings["times"]["showSeconds"] = false;
									Filer.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
								});
								break;
							case "yes":
								Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
									if (err) return console.log(err);
									const settings = JSON.parse(data);
									settings["times"]["showSeconds"] = true;
									Filer.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
								});
								break;
						}
					} else if (select.getAttribute("action-for") === "24h-12h") {
						switch (option.getAttribute("value").toLowerCase()) {
							case "no":
								Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
									if (err) return console.log(err);
									const settings = JSON.parse(data);
									settings["times"]["format"] = "12h";
									Filer.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
								});
								break;
							case "yes":
								Filer.fs.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8", (err, data) => {
									if (err) return console.log(err);
									const settings = JSON.parse(data);
									settings["times"]["format"] = "24h";
									Filer.fs.writeFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, JSON.stringify(settings));
								});
								break;
						}
					} else if (select.getAttribute("action-for") === "location-state") {
						Filer.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
							if (err) return console.log(err);
							const settings = JSON.parse(data);
							settings["location"]["state"] = option.getAttribute("value");
							Filer.fs.writeFile("/system/etc/terbium/settings.json", JSON.stringify(settings));
						});
					} else if (select.getAttribute("action-for") === "temperature-unit") {
						Filer.fs.readFile("/system/etc/terbium/settings.json", "utf8", (err, data) => {
							if (err) return console.log(err);
							const settings = JSON.parse(data);
							settings["weather"]["unit"] = option.getAttribute("value");
							Filer.fs.writeFile("/system/etc/terbium/settings.json", JSON.stringify(settings));
							window.parent.dispatchEvent(new Event("updWeather"));
						});
					}
				}
			});
		});
	});
});
