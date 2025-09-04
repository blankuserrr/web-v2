import type { Anura } from "../Anura";
import { Lib } from "./lib";

// API Stub: TODO Later
interface LibManifest {
	name: string;
	icon: string;
	package: string;
	versions: {
		[key: string]: string;
	};
	installHook?: string;
	cache?: boolean;
	currentVersion: string;
}

let anura: Anura;

export function setAnura(anuraInstance: Anura) {
	anura = anuraInstance;
}

export class ExternalLib extends Lib {
	source: string;
	manifest: LibManifest;
	// Import caching is optional
	cache: {
		[key: string]: any;
	} = {};
	// The installed libs at the time of the last cache
	// If more libs are installed, the cache is invalidated
	// This is to prevent a race condition where a lib is installed
	// before the dependency is installed
	installedLibs: string[] = [];

	constructor(manifest: LibManifest, source: string) {
		super();
		this.manifest = manifest;
		this.name = manifest.name;
		this.icon = `${source}/${manifest.icon}`;
		this.source = source;
		this.package = manifest.package;
		this.latestVersion = manifest.currentVersion;
		Object.keys(manifest.versions).forEach(version => {
			this.versions[version] = `${source}/${manifest.versions[version]}`;
			console.log(this.versions[version]);
		});
		if (manifest.installHook) {
			import(/* @vite-ignore */ `${source}/${manifest.installHook}`).then(module => {
				try {
					// @ts-expect-error
					module.default(anura, this);
				} catch (err) {
					console.warn(err);
				}
			});
		}
	}
	async getImport(version?: string): Promise<any> {
		if (!version) {
			version = this.latestVersion;
		}
		if (this.manifest.cache && this.cache[version] && this.installedLibs === Object.keys(window.anura.libs)) {
			return this.cache[version];
		}
		if (this.versions[version]) {
			// @vite-ignore
			const mod = await import(/* @vite-ignore */ this.versions[version]);
			if (this.manifest.cache) {
				this.cache[version] = mod;
				this.installedLibs = Object.keys(window.anura.libs);
			}
			return mod;
		}
		throw new Error(`Library ${this.name} does not supply version ${version}`);
	}
}
