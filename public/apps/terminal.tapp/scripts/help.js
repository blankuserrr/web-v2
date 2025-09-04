async function help(args) {
	if (args.length > 0) {
		const scriptName = args[0];
		const scriptList = JSON.parse(await Filer.fs.promises.readFile(`/apps/user/${sessionStorage.getItem("currAcc")}/terminal/info.json`, "utf8"));
		const script = scriptList.find(script => script.name === scriptName);
		if (script) {
			displayOutput(`${script.name}: ${script.usage ? `${script.usage}` : ""}`);
		} else {
			displayError(`help: ${scriptName}: No such script`);
		}
		createNewCommandInput();
	} else {
		fetch("./scripts/info.json")
			.then(response => response.json())
			.then(scriptList => {
				for (const script of scriptList) {
					displayOutput(`${script.usage.padEnd(30)} ${script.description}`);
				}
				createNewCommandInput();
			});
	}
}
help(args);
