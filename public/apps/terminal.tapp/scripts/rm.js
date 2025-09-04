function rm(args) {
	const availableOptions = [
		"-f: ignore nonexistent files and arguments, never prompt.",
		"-r: remove directories and their contents recursively.; optionally you can also use -rf to remove directories and their contents recursively without prompt.",
		"-v: explain what is being done (not default).",
		"-d: remove empty directories.; you should use rmdir instead.",
	];

	if (!args._raw || args._raw.includes("-h")) {
		displayOutput("Usage: rm [OPTION] [FILE]");
		displayOutput("Remove (unlink) the FILE(s).");
		displayOutput(" ");
		displayOutput("Options:");
		for (const option of availableOptions) {
			const nspace = " ";
			let [opt, desc] = option.split(": ");
			const optionally = desc.split(";")[1];
			desc = desc.replace(";", "").replace(optionally, "");
			displayOutput(`  ${opt.padEnd(10)} ${desc}`);
			if (optionally) {
				displayOutput(`  ${nspace.padEnd(10)}${optionally}`);
			}
		}
		createNewCommandInput();
		return;
	}
	const user = sessionStorage.getItem("currAcc");
	const systemDirs = ["/home", `/home/${user}/documents`, `/home/${user}/videos`, `/home/${user}/pictures`, `/home/${user}/music`];

	for (const sdir of systemDirs) {
		if (path === sdir) {
			displayOutput(`rm: cannot remove "${path}": Is a system directory`);
			createNewCommandInput();
			return;
		}
	}

	const options = {
		force: false,
		recursive: false,
		verbose: false,
		directory: false,
	};

	if (args._raw.includes("-rf")) {
		options.force = true;
		options.recursive = true;
	}
	if (args._raw.includes("-r")) {
		options.recursive = true;
	}
	if (args._raw.includes("-f")) {
		options.force = true;
	}
	if (args._raw.includes("-v")) {
		options.verbose = true;
	}
	if (args._raw.includes("-d")) {
		options.directory = true;
	}
	const toDel = `${path}/${args._raw.replace(/^-f|-rf|-r|-v|-d/g, "").trim()}`;
	console.log(toDel);
	Filer.fs.stat(toDel, (err, stats) => {
		if (err) return console.log(err);
		if (stats.isDirectory()) {
			if (options.force || options.recursive) {
				tb.sh.rm(toDel, { recursive: options.recursive, force: options.force }, err => {
					if (err) {
						displayError(`rm: cannot remove "${toDel}": ${err.message}`);
						createNewCommandInput();
					} else {
						if (options.verbose) {
							displayOutput(`removed directory "${toDel}"`);
						}
						createNewCommandInput();
					}
				});
			} else if (options.directory) {
				Filer.fs.rmdir(toDel, err => {
					if (err) {
						if (err.code === "ENOTEMPTY") {
							displayError(`rm: cannot remove "${toDel}": Directory not empty`);
							displayOutput("Use -r to remove non-empty directories. or -rf to remove non-empty directories without prompt.");
						} else {
							displayError(`rm: cannot remove "${toDel}": ${err.message}`);
						}
						createNewCommandInput();
					} else {
						if (options.verbose) {
							displayOutput(`removed directory "${toDel}"`);
						}
						createNewCommandInput();
					}
				});
			} else {
				displayError(`rm: cannot remove "${toDel}": Is a directory`);
				createNewCommandInput();
			}
		} else {
			tb.sh.rm(toDel, { recursive: options.recursive, force: options.force }, err => {
				if (err) {
					displayError(`rm: cannot remove "${toDel}": ${err.message}`);
					createNewCommandInput();
				} else {
					if (options.verbose) {
						displayOutput(`removed "${toDel}"`);
					}
					createNewCommandInput();
				}
			});
		}
	});
}
rm(args);
