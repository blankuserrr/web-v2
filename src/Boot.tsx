import { type Component, createEffect, createSignal, For, onMount } from "solid-js";
import { version } from "../package.json";
import { dirExists, fileExists } from "./sys/types";

const Boot: Component = () => {
	const [selected, setSelected] = createSignal(0);
	const [showCursor, setShowCursor] = createSignal(false);
	const [bootentries, setentries] = createSignal<{ name: string; action: () => void }[]>([]);

	const boot = () => {
		sessionStorage.setItem("boot", "true");
		window.location.reload();
	};

	const cloak = () => {
		const newWindow = window.open("about:blank", "_blank");
		if (newWindow) {
			const newDocument = newWindow.document;
			newDocument.open();
			sessionStorage.setItem("boot", "true");
			newDocument.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style type="text/css">
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                </style>
            </head>
            <body>
                <iframe style="border: none; width: 100%; height: 100vh;" src="${window.location.href}?boot=true"></iframe>
            </body>
            </html>
        `);
			newDocument.close();
		}
		window.location.href = "https://google.com";
		console.log("Cloak Opened!");
	};

	const recovery = () => {
		sessionStorage.setItem("recovery", "true");
		window.location.reload();
	};

	onMount(async () => {
		const getEntries = async () => {
			if (!(await fileExists("/bootentries.json"))) {
				await Filer.fs.promises.writeFile(
					"/bootentries.json",
					JSON.stringify([
						{ name: "TB Solid", action: boot.toString() },
						{ name: "TB Solid (Cloaked)", action: cloak.toString() },
						{ name: "TB System Recovery", action: recovery.toString() },
					]),
				);
			}

			const entries = JSON.parse(await Filer.fs.promises.readFile("/bootentries.json", "utf8"));
			const recreatedEntries = entries.map((entry: { action: string }) => ({
				...entry,
				action: eval(`(${entry.action})`),
			}));

			if (localStorage.getItem("setup") === "true" && (!(await dirExists("/system/etc/terbium/")) || !(await dirExists("/apps/system/")))) {
				const bootent = recreatedEntries.filter((entry: any) => entry.name !== "TB Solid" && entry.name !== "TB Solid (Cloaked)");
				bootent.push({ name: "TB System Recovery", action: eval(`(${recovery.toString()})`) });
				setentries(bootent);
			} else {
				setentries(recreatedEntries);
			}
		};
		await getEntries();

		const getPlatform = () => {
			const mobileuas =
				/(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|samsungbrowser.*mobile|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|playbook|silk|iPhone|iPad/i;
			const crosua = /CrOS/;
			if (mobileuas.test(navigator.userAgent) && !crosua.test(navigator.userAgent)) {
				return "mobile";
			}
			if (!mobileuas.test(navigator.userAgent) && navigator.maxTouchPoints > 1 && navigator.userAgent.indexOf("Macintosh") !== -1 && navigator.userAgent.indexOf("Safari") !== -1) {
				return "mobile";
			}
			return "desktop";
		};
		if (getPlatform() === "mobile") {
			setShowCursor(true);
		}
	});

	createEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowUp") {
				setSelected(prevSelected => (bootentries().length === 0 ? 0 : prevSelected === 0 ? bootentries().length - 1 : prevSelected - 1));
			} else if (e.key === "ArrowDown") {
				setSelected(prevSelected => (prevSelected === bootentries().length - 1 ? 0 : prevSelected + 1));
			} else if (e.key === "Enter") {
				const selectedEntry = bootentries()[selected()];
				if (selectedEntry) {
					selectedEntry.action();
				}
			} else if (e.key === "Escape") {
				setShowCursor(prev => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	});

	return (
		<div class={`overflow-hidden w-full h-full flex justify-center pt-[30px] bg-[#0e0e0e] ${showCursor() ? "" : "cursor-none"}`}>
			<div class="flex flex-col items-center w-full p-2 text-[#ffffff48] overflow-hidden">
				<div class="py-10 w-full flex justify-center text-[#ffffff68] font-bold text-2xl duration-150">Terbium Boot Loader - Version {version}</div>
				<div class="mt-1 p-2 flex flex-col grow overflow-auto w-full border-solid border-[#ffffff68] border-2 rounded-xl">
					<For each={bootentries()}>
						{(entry, index) => (
							<span
								class={`p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md ${selected() === index() && !showCursor() ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"} ${showCursor() ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : ""}`}
								onClick={() => {
									if (showCursor()) entry.action();
								}}
							>
								{entry.name}
							</span>
						)}
					</For>
				</div>
				<span class="font-mono">
					Use the <span class="text-[#ffffff68] text-2xl">↑</span> and <span class="text-[#ffffff68] text-2xl">↓</span> keys to switch entry.
				</span>
				<span class="font-mono">
					Press the <span class="text-[#ffffff68] font-sans font-bold">enter</span> key to boot into the selection.
				</span>
			</div>
		</div>
	);
};

export default Boot;
