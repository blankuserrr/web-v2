import { unzipSync } from "fflate";
import { libcurl } from "libcurl.js/bundled";
import { type Component, createEffect, createSignal, onMount, Show } from "solid-js";
import { version } from "../package.json";
import hashData from "./hash.json";
import { dirExists } from "./sys/types";

const hash = (hashData as { hash: string }).hash;

const Recovery: Component = () => {
	const [selected, setSelected] = createSignal(0);
	const [showCursor, setShowCursor] = createSignal(false);
	const [msg, setMsg] = createSignal<string | null>(null);
	const [action, setAction] = createSignal<(() => void) | null>(null);
	const [progress, setProgress] = createSignal(0);
	const [updCache, setUpdCache] = createSignal(false);
	let msgbox!: HTMLDivElement;
	let main!: HTMLDivElement;
	let progresscheck!: HTMLDivElement;
	let statusref!: HTMLParagraphElement;

	async function copyDir(inp: string, dest: string, rn?: boolean) {
		if (rn === true) {
			if (!(await dirExists(dest))) {
				await Filer.fs.promises.mkdir(dest);
			}
		}
		const files = await Filer.fs.promises.readdir(inp);
		const totalFiles = files.length;
		for (const [index, file] of files.entries()) {
			const stats = await Filer.fs.promises.stat(`${inp}/${file}`);
			if (stats.isDirectory()) {
				await Filer.fs.promises.mkdir(`${dest}/${file}`);
				await copyDir(`${inp}/${file}`, `${dest}/${file}`, true);
			} else {
				await Filer.fs.promises.writeFile(`${dest}/${file}`, await Filer.fs.promises.readFile(`${inp}/${file}`, "utf8"));
			}
			statusref.innerText = `Creating a copy of: ${file}...`;
			setProgress(Math.floor(((index + 1) / totalFiles) * 100));
		}
	}

	onMount(async () => {
		if (await dirExists("/system/tmp/terb-upd/")) {
			setUpdCache(true);
		}
	});

	const prodins = async () => {
		setShowCursor(false);
		msgbox.classList.remove("flex");
		msgbox.classList.add("hidden");
		progresscheck.classList.remove("hidden");
		progresscheck.classList.add("flex");
		if (await dirExists("/system/")) {
			// @ts-expect-error types
			await new Filer.fs.Shell().promises.rm("/system/", { recursive: true });
		}
		if (await dirExists("/apps/")) {
			// @ts-expect-error types
			await new Filer.fs.Shell().promises.rm("/apps/", { recursive: true });
		}
		if (await dirExists("/home/")) {
			// @ts-expect-error types
			await new Filer.fs.Shell().promises.rm("/home/", { recursive: true });
		}
		await download("https://cdn.terbiumon.top/recovery/latest.zip", "/uploaded.zip");
		setShowCursor(false);
		await unzip("//uploaded.zip", "//");
		await Filer.fs.promises.mkdir("/system/tmp/");
		statusref.innerText = "Cleaning up...";
		setProgress(85);
		await Filer.fs.promises.unlink("//uploaded.zip");
		setProgress(100);
		statusref.innerText = "Restarting...";
		sessionStorage.clear();
		sessionStorage.setItem("boot", "true");
		localStorage.setItem("setup", "true");
		window.location.reload();
	};

	const zipins = async () => {
		const fauxput = document.createElement("input");
		fauxput.type = "file";
		fauxput.accept = ".zip";
		fauxput.onchange = async e => {
			const target = e.target as HTMLInputElement;
			if (target?.files) {
				const file = target.files[0];
				const content = await file.arrayBuffer();
				if (await dirExists("/system/")) {
					// @ts-expect-error types
					await new Filer.fs.Shell().promises.rm("/system/", { recursive: true });
				}
				if (await dirExists("/apps/")) {
					// @ts-expect-error types
					await new Filer.fs.Shell().promises.rm("/apps/", { recursive: true });
				}
				if (await dirExists("/home/")) {
					// @ts-expect-error types
					await new Filer.fs.Shell().promises.rm("/home/", { recursive: true });
				}
				await Filer.fs.promises.writeFile("//uploaded.zip", Filer.Buffer.from(content));
				setShowCursor(false);
				main.classList.remove("flex");
				main.classList.add("hidden");
				progresscheck.classList.remove("hidden");
				progresscheck.classList.add("flex");
				await unzip("//uploaded.zip", "//");
				await Filer.fs.promises.mkdir("/system/tmp/");
				statusref.innerText = "Cleaning up...";
				setProgress(85);
				await Filer.fs.promises.unlink("//uploaded.zip");
				setProgress(100);
				statusref.innerText = "Restarting...";
				sessionStorage.clear();
				sessionStorage.setItem("boot", "true");
				localStorage.setItem("setup", "true");
				window.location.reload();
			}
		};
		fauxput.click();
	};

	async function unzip(path: string, target: string) {
		const response = await fetch(`/fs/${path}`);
		const zipFileContent = await response.arrayBuffer();
		if (!(await dirExists(target))) {
			// @ts-expect-error types
			await Filer.fs.promises.mkdir(target, { recursive: true });
		}
		const compressedFiles = unzipSync(new Uint8Array(zipFileContent));
		for (const [relativePath, content] of Object.entries(compressedFiles)) {
			const fullPath = `${target}/${relativePath}`;
			const pathParts = fullPath.split("/");
			let currentPath = "";
			for (let i = 0; i < pathParts.length; i++) {
				currentPath += `${pathParts[i]}/`;
				if (i === pathParts.length - 1 && !relativePath.endsWith("/")) {
					await Filer.fs.promises.writeFile(currentPath.slice(0, -1), Filer.Buffer.from(content));
				} else if (!(await dirExists(currentPath))) {
					await Filer.fs.promises.mkdir(currentPath);
				}
			}
			if (relativePath.endsWith("/")) {
				await Filer.fs.promises.mkdir(fullPath);
			}
		}
		return "Done!";
	}

	async function download(url: string, location: string) {
		// @ts-expect-error
		libcurl.set_websocket(`${window.location.protocol.replace("http", "ws")}//${window.location.hostname}:${window.location.port}/wisp/`);
		const response = await libcurl.fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download the file. Status: ${response.status}`);
		}
		const content = await response.arrayBuffer();
		await Filer.fs.promises.writeFile(location, Filer.Buffer.from(content));
		console.log(`File saved successfully at: ${location}`);
	}

	createEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.key === "ArrowUp") {
				setSelected(prevSelected => (prevSelected === 0 ? (updCache() ? 4 : 3) : prevSelected - 1));
			} else if (e.key === "ArrowDown") {
				setSelected(prevSelected => (prevSelected === (updCache() ? 4 : 3) ? 0 : prevSelected + 1));
			} else if (e.key === "Enter") {
				if (selected() === 0) {
					localStorage.clear();
					sessionStorage.clear();
					sessionStorage.setItem("boot", "true");
					window.location.reload();
					if (await dirExists("/system/")) {
						// @ts-expect-error types
						await new Filer.fs.Shell().promises.rm("/system/", { recursive: true });
					}
					if (await dirExists("/apps/")) {
						// @ts-expect-error types
						await new Filer.fs.Shell().promises.rm("/apps/", { recursive: true });
					}
					if (await dirExists("/home/")) {
						// @ts-expect-error types
						await new Filer.fs.Shell().promises.rm("/home/", { recursive: true });
					}
				} else if (selected() === 1) {
					msgbox.classList.remove("hidden");
					msgbox.classList.add("flex");
					main.classList.add("hidden");
					main.classList.remove("flex");
					setShowCursor(true);
					setMsg("BE AWARE if your static hosting this download will NOT work. Proceed?");
					setAction(() => prodins);
				} else if (selected() === 2) {
					zipins();
				} else if (selected() === 3 && updCache()) {
					setShowCursor(false);
					msgbox.classList.remove("flex");
					msgbox.classList.add("hidden");
					progresscheck.classList.remove("hidden");
					progresscheck.classList.add("flex");
					await copyDir("/system/tmp/terb-upd/", "/apps/", true);
					await Filer.fs.promises.writeFile("/system/etc/terbium/hash.cache", hash);
					// @ts-expect-error
					await new Filer.fs.Shell().promises.rm("/system/tmp/terb-upd/", { recursive: true });
					window.location.reload();
				} else if (selected() === (updCache() ? 4 : 3)) {
					sessionStorage.clear();
					window.location.reload();
				}
			} else if (e.key === "Escape") {
				setShowCursor(prev => !prev);
			}
		};
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

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	});

	return (
		<div class={`overflow-hidden w-full h-full flex justify-center pt-[30px] bg-[#0e0e0e] ${showCursor() ? "" : "cursor-none"}`}>
			<div class="flex flex-col items-center w-full p-2 text-[#ffffff48] overflow-hidden">
				<div class="py-10 w-full flex justify-center text-[#ffffff68] font-bold text-2xl duration-150">Terbium Recovery Utility - Version {version}</div>
				<div ref={msgbox} class="hidden mt-1 p-2 flex-col flex-grow overflow-auto w-full border-solid border-[#ffffff68] border-2 rounded-xl z-10">
					<div class="flex flex-col items-center justify-center h-full">
						<div class="flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-45">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
							</svg>
							<span class="ml-2 text-5xl">{msg()}</span>
						</div>
						<div class="flex mt-4">
							<button
								class="mr-2 cursor-pointer bg-[#ffffff0a] text-[#ffffff38] border-[#ffffff22] hover:bg-[#ffffff10] hover:text-[#ffffff8d] focus:bg-[#ffffff1f] focus:text-[#ffffff8d] focus:border-[#73a9ffd6] focus:ring-[#73a9ff74] focus:outline-hidden focus:ring-2 ring-[transparent] ring-0 border-[1px] font-[600] px-[20px] py-[8px] rounded-[6px] duration-150"
								onClick={() => action()?.()}
							>
								Proceed
							</button>
							<button
								class="cursor-pointer bg-[#ffffff0a] text-[#ffffff38] border-[#ffffff22] hover:bg-[#ffffff10] hover:text-[#ffffff8d] focus:bg-[#ffffff1f] focus:text-[#ffffff8d] focus:border-[#73a9ffd6] focus:ring-[#73a9ff74] focus:outline-hidden focus:ring-2 ring-[transparent] ring-0 border-[1px] font-[600] px-[20px] py-[8px] rounded-[6px] duration-150"
								onClick={() => {
									setShowCursor(false);
									msgbox.classList.remove("flex");
									msgbox.classList.add("hidden");
									main.classList.add("flex");
									main.classList.remove("hidden");
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
				<div ref={progresscheck} class="hidden bg-[#0e0e0e] h-full justify-center items-center flex-col lg:h-full md:h-full">
					<img src="/tb.svg" alt="Terbium" class="w-[25%] h-[25%]" />
					<div class="duration-150 flex flex-col justify-center items-center">
						<div class="text-container relative flex flex-col justify-center items-end">
							<div class="bg-linear-to-b from-[#ffffff] to-[#ffffff77] text-transparent bg-clip-text flex flex-col lg:items-center md:items-center sm:items-center">
								<span class="font-[700] lg:text-[34px] md:text-[28px] sm:text-[22px] text-right duration-150">
									<span class="font-[1000] duration-150">Terbium is installing</span>
								</span>
								<br />
								<p>Please DO NOT close this tab</p>
							</div>
						</div>
					</div>
					<p ref={statusref} class="mt-1">
						Downloading...
					</p>
					<div class="relative flex w-[30%] h-3 rounded-full bg-[#00000020] overflow-hidden mt-4">
						<div class="absolute h-full bg-[#50bf66] rounded-full" style={{ width: `${progress()}%` }} />
					</div>
				</div>
				<div ref={main} class="mt-1 p-2 flex flex-col flex-grow overflow-auto w-full border-solid border-[#ffffff68] border-2 rounded-xl">
					<span
						class={`p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md ${selected() === 0 && !showCursor() ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"} ${showCursor() ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : ""}`}
						onClick={async () => {
							localStorage.clear();
							sessionStorage.clear();
							sessionStorage.setItem("boot", "true");
							window.location.reload();
							if (await dirExists("/system/")) {
								// @ts-expect-error types
								await new Filer.fs.Shell().promises.rm("/system/", { recursive: true });
							}
							if (await dirExists("/apps/")) {
								// @ts-expect-error types
								await new Filer.fs.Shell().promises.rm("/apps/", { recursive: true });
							}
							if (await dirExists("/home/")) {
								// @ts-expect-error types
								await new Filer.fs.Shell().promises.rm("/home/", { recursive: true });
							}
						}}
					>
						Reinstall Terbium
					</span>
					<span
						class={`p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md ${selected() === 1 && !showCursor() ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"} ${showCursor() ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : ""}`}
						onClick={() => {
							msgbox.classList.remove("hidden");
							msgbox.classList.add("flex");
							main.classList.add("hidden");
							main.classList.remove("flex");
							setShowCursor(true);
							setMsg("BE AWARE if your static hosting this download will NOT work. Proceed?");
							setAction(() => prodins);
						}}
					>
						Restore from Production Instance (Beta)
					</span>
					<span class={`p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md ${selected() === 2 && !showCursor() ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"} ${showCursor() ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : ""}`} onClick={zipins}>
						Restore from ZIP (Beta)
					</span>
					<Show when={updCache()}>
						<span
							class={`p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md ${selected() === 3 && !showCursor() ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"} ${showCursor() ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : ""}`}
							onClick={async () => {
								setShowCursor(false);
								msgbox.classList.remove("flex");
								msgbox.classList.add("hidden");
								progresscheck.classList.remove("hidden");
								progresscheck.classList.add("flex");
								await copyDir("/system/tmp/terb-upd/", "/apps/", true);
								await Filer.fs.promises.writeFile("/system/etc/terbium/hash.cache", hash);
								// @ts-expect-error
								await new Filer.fs.Shell().promises.rm("/system/tmp/terb-upd/", { recursive: true });
								window.location.reload();
							}}
						>
							Restore from Update Cache
						</span>
					</Show>
					<span
						class={`p-2 px-2.5 text-sm font-extrabold lg:text-lg md:text-base border-[1px] rounded-md ${selected() === (updCache() ? 4 : 3) && !showCursor() ? "bg-[#ffffff18] border-[#ffffff20]" : "border-transparent"} ${showCursor() ? "hover:bg-[#ffffff18] hover:border-[#ffffff20]" : ""}`}
						onClick={() => {
							sessionStorage.clear();
							window.location.reload();
						}}
					>
						Exit
					</span>
				</div>
				<span class="font-mono">
					Use the <span class="text-[#ffffff68] text-2xl">↑</span> and <span class="text-[#ffffff68] text-2xl">↓</span> keys to switch entry.
				</span>
				<span class="font-mono">
					Press the <span class="text-[#ffffff68] font-sans font-bold">enter</span> key to select.
				</span>
			</div>
		</div>
	);
};

export default Recovery;
