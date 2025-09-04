export const registry = {
	cache: {
		state: "unready",
	},
	async get(data: any): Promise<any> {
		if (this.cache.state == "unready") {
			// Defer if not loaded
			console.log("Unable to get data, retrying in 2 seconds");
			await new Promise(r => setTimeout(r, 2000));

			return (await this.get(data)) as any;
		}
		// @ts-expect-error
		return this.cache[data.path] as any;
	},
	async set(data: any) {
		if (this.cache.state == "unready") {
			// Defer if not loaded
			console.log("Unable to get data, retrying in 2 seconds");
			await new Promise(r => setTimeout(r, 2000));

			await this.set(data);
		}

		// void, nothing happens here for now other than storing changes for the session
		//@ts-expect-error
		this.cache[data.path] = data.content;

		if (window.Filer) {
			const Filer = window.Filer;
			await Filer.fs.promises.writeFile("/system/etc/terbium/settings.json", JSON.stringify(this.cache));
		}
	},
	exists(data: any) {
		// @ts-expect-error
		if (this.cache[data]) {
			return true;
		}
		return false;
	},
};
