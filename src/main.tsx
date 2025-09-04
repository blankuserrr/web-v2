import { type Component, createSignal, onMount } from "solid-js";
import { Dynamic, render } from "solid-js/web";
import App from "./App";
import Boot from "./Boot";
import CustomOS from "./CustomOS";
import hashData from "./hash.json";
import "./index.css";
import Login from "./Login";
import Setup from "./Setup";
import Updater from "./Updater";

const hash = (hashData as { hash: string }).hash;

import { BareMuxConnection } from "@mercuryworkshop/bare-mux";
import Loader from "./Loading";
import Recovery from "./Recovery";
import { fileExists } from "./sys/types";

const Root: Component = () => {
	const [currPag, setPag] = createSignal<Component>(Loader);
	const params = new URLSearchParams(window.location.search);

	onMount(async () => {
		const tempTransport = async () => {
			const connection = new BareMuxConnection("/baremux/worker.js");
			await connection.setTransport("/epoxy/index.mjs", [{ wisp: "wss://wisp.terbiumon.top/wisp/" }]);
			const scramjet = new window.ScramjetController({
				prefix: "/service/",
				files: {
					wasm: "/scramjet/scramjet.wasm.wasm",
					worker: "/scramjet/scramjet.worker.js",
					client: "/scramjet/scramjet.client.js",
					shared: "/scramjet/scramjet.shared.js",
					sync: "/scramjet/scramjet.sync.js",
				},
				defaultFlags: {
					rewriterLogs: false,
				},
				codec: {
					encode: `
            if (!url) return Promise.resolve(url);
            let result = "";
	          let len = url.length;
	          for (let i = 0; i < len; i++) {
	            const char = url[i];
              result += i % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char;
            }
	          return encodeURIComponent(result);
          `,
					decode: `
            if (!url) return Promise.resolve(url);
	          url = decodeURIComponent(url);
	          let result = "";
            let len = url.length;
	          for (let i = 0; i < len; i++) {
	            const char = url[i];
              result += i % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char;
	          }
		        return result;
          `,
				},
			});
			scramjet.init();
			navigator.serviceWorker.register("/anura-sw.js");
		};

		await tempTransport();

		if (sessionStorage.getItem("recovery")) {
			setPag(() => Recovery);
		} else if (sessionStorage.getItem("boot") || params.get("boot")) {
			const upd = async () => {
				let sha: string;
				if (await fileExists("/system/etc/terbium/hash.cache")) {
					sha = await Filer.fs.promises.readFile("/system/etc/terbium/hash.cache", "utf8");
				} else {
					sha = hash;
				}
				if (localStorage.getItem("setup")) {
					if (localStorage.getItem("setup") && (sha !== hash || sessionStorage.getItem("skipUpd"))) {
						setPag(() => Updater);
					} else {
						if (sessionStorage.getItem("logged-in") && sessionStorage.getItem("logged-in") === "true") {
							setPag(() => App);
						} else {
							setPag(() => Login);
						}
					}
				} else {
					setPag(() => Setup);
				}
			};
			await upd();
		} else if (sessionStorage.getItem("cusboot")) {
			setPag(() => CustomOS);
		} else {
			setPag(() => Boot);
		}
	});

	return <Dynamic component={currPag()} />;
};

const root = document.getElementById("root");

if (root) {
	render(() => <Root />, root);
}
