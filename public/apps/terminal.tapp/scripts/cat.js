function cat(args) {
	if (args._raw.length <= 0) {
		displayError("cat: missing operand");
		createNewCommandInput();
		return;
	}
	displayOutput("%cRight now cat only outputs the contents of a file.\n", "color: #e39d34");
	tb.sh.cat(`${path}/${args._raw}`, (err, data) => {
		if (err) {
			displayError(`cat: ${err.message}`);
			createNewCommandInput();
		} else {
			displayOutput(data);
			createNewCommandInput();
		}
	});
}
cat(args);
