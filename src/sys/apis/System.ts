import { version } from "../../../package.json";

export class System {
	version(type: string | number) {
		if (type === "string") return version.toString();
		if (type === "number") return Number(version);
	}
	works(type: string) {
		return typeof type !== "undefined";
	}
}
