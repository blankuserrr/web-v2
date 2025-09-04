import { Icon } from "solid-heroicons";
import { magnifyingGlass } from "solid-heroicons/solid";
import { type Component, createEffect, createSignal, For, Show } from "solid-js";
import { searchApps, searchFiles } from "../apis/SysSearch";
import { useSearchMenuStore } from "../Store";
import { StartItem } from "./Dock";
import { createWindow } from "./WindowArea";

interface SearchProps {
	className: string;
}

const SearchMenu: Component<SearchProps> = props => {
	const searchMenuStore = useSearchMenuStore();

	const [searchMatch, setSearchMatch] = createSignal(false);
	const [resultOpen, setResultOpen] = createSignal(false);
	const [searchHasText, setSearchHasText] = createSignal(false);
	const [searchActive, setSearchActive] = createSignal(false);
	const [recentApps, setRecentApps] = createSignal<any[]>([]);
	let searchMenuRef: HTMLDivElement | undefined;
	let searchRef: HTMLInputElement | undefined;
	let containerRef: HTMLDivElement | undefined;
	let resultRef: HTMLDivElement | undefined;
	let recentAppsRef: HTMLDivElement | undefined;
	const [results, setResults] = createSignal<any[]>([]);
	const [noResults, setNoResults] = createSignal(false);

	const resetState = () => {
		if (searchRef) searchRef.value = "";
		setNoResults(false);
		setSearchMatch(false);
		setSearchActive(false);
		setSearchHasText(false);
		setResultOpen(false);
		setResults([]);
		setTimeout(() => {
			recentAppsRef?.classList.add("col-span-2");
			containerRef?.classList.remove("grid-cols-2");
			containerRef?.classList.add("grid-cols-1");
			resultRef?.classList.add("absolute");
		}, 200);
	};

	createEffect(() => {
		const getRecentApps = async () => {
			try {
				const recentAppsData = JSON.parse(await Filer.fs.promises.readFile("/system/var/terbium/recent.json"));
				setRecentApps(recentAppsData);
				searchRef?.focus();
			} catch (e) {
				console.error("Failed to load recent apps", e);
			}
		};

		if (searchMenuStore.open) {
			getRecentApps();
		} else {
			resetState();
		}
	});

	createEffect(() => {
		// register live refs with the store so Dock can read them for click-outside logic
		searchMenuStore.setRefs(searchRef, searchMenuRef);
	});

	return (
		<div ref={searchMenuRef} class={`${props.className} bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-sm rounded-xl flex flex-col items-center justify-between min-w-[440px] h-[266px]`}>
			<div
				class="flex gap-2 items-center text-[#ffffffa4] p-2.5 pb-0 w-full duration-700"
				classList={{
					"": searchMenuStore.open,
					"translate-y-2 opacity-0": !searchMenuStore.open,
				}}
			>
				<Icon path={magnifyingGlass} class="size-6 text-[#ffffff86] stroke-current stroke-[2px]" />
				<div class="relative flex items-center w-full">
					<span
						class="absolute font-[680] text-lg pointer-events-none duration-150"
						classList={{
							"opacity-0 -translate-x-1.5": searchHasText(),
							"opacity-100": searchActive(),
							"opacity-75": !searchHasText() && !searchActive(),
						}}
					>
						Search for apps and files
					</span>
					<input
						ref={searchRef}
						type="text"
						class="bg-transparent focus-visible:outline-none text-lg font-[680] w-full cursor-text"
						onFocus={() => setSearchActive(true)}
						onBlur={() => setSearchActive(false)}
						onInput={async e => {
							const value = (e.target as HTMLInputElement).value;
							setSearchHasText(value.length > 0);

							if (value.length > 0) {
								setSearchActive(true);
								resultRef?.classList.remove("absolute");
								recentAppsRef?.classList.remove("col-span-2");
								setTimeout(() => {
									containerRef?.classList.remove("grid-cols-1");
									containerRef?.classList.add("grid-cols-2");
									setResultOpen(true);
								}, 200);

								const appres = await searchApps(value);
								const filesres = await searchFiles(value);

								if (appres && Array.isArray(appres) && appres.length > 0) {
									const app = appres[0];
									const appName = typeof app.name === "string" ? app.name : app.name?.text || "";
									setResults([
										[
											{
												icon: `<img class="w-[49px] h-[49px]" src="${app.icon}"/>`,
												name: appName.charAt(0).toUpperCase() + appName.slice(1),
												dir: app.dir || "Unknown Path",
												config: app.cfg,
												click: () => {
													createWindow(app.cfg);
													searchMenuStore.setOpen(false);
												},
											},
										],
										[],
									]);
									setNoResults(false);
								} else if (filesres && Array.isArray(filesres) && filesres.length > 0) {
									const fileIconsData = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/file-icons.json", "utf8"));
									const getIcon = (ext: string) => fileIconsData["name-to-path"][fileIconsData["ext-to-name"][ext]] || fileIconsData["name-to-path"].Unknown;

									const fileItems = await Promise.all(
										filesres.map(async (f: any) => ({
											icon: (await Filer.fs.promises.readFile(getIcon(f.ext), "utf8")).replace(/<svg([^>]*)>/, '<svg$1 width="48" height="48">'),
											name: f.name.charAt(0).toUpperCase() + f.name.slice(1) || value.charAt(0).toUpperCase() + value.slice(1),
											path: f.path || "",
											ext: f.ext,
											dir: f.dir,
											onClick: async () => {
												// File open logic here
												searchMenuStore.setOpen(false);
											},
										})),
									);
									setResults([[], fileItems]);
									setNoResults(false);
								} else {
									setResults([[], []]);
									setNoResults(true);
								}
								setSearchActive(false);
							} else {
								resetState();
							}
						}}
					/>
				</div>
			</div>
			<div class="relative flex items-center min-h-[104px] h-full w-full gap-2 p-2.5 pt-0 duration-1000" classList={{ "": searchMenuStore.open, "translate-y-4 opacity-0": !searchMenuStore.open }}>
				<div ref={containerRef} class="grid gap-2 pt-2 w-full h-full overflow-hidden grid-cols-1">
					<div ref={recentAppsRef} class="relative grid overflow-hidden col-span-2" classList={{ "items-center justify-center": recentApps().length === 0 }}>
						<Show when={recentApps().length > 0} fallback={<h1 class="font-bold text-lg leading-none pt-2 text-[#ffffff68]">No recent apps</h1>}>
							<div class="flex flex-col gap-2">
								<h1 class="font-bold text-lg leading-none text-[#ffffff68]">Recent apps</h1>
								<div class="grid items-center gap-1 overflow-y-auto rounded-md" classList={{ "grid-cols-1": results().length > 0, "grid-cols-2": results().length === 0 }}>
									<For
										each={recentApps()
											.sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0) || (b.weight ?? 0) - (a.weight ?? 0))
											.slice(0, 8)}
									>
										{app => (
											<StartItem
												className="w-full"
												title={app.title}
												icon={app.icon}
												pid={undefined}
												src={app.src}
												onClick={() => {
													createWindow({
														src: app.src,
														size: app.size,
														icon: typeof app.icon === "string" ? app.icon : undefined,
														title: app.title,
														proxy: app.proxy,
														snapable: app.snapable,
													});
													searchMenuStore.setOpen(false);
												}}
											/>
										)}
									</For>
								</div>
							</div>
						</Show>
					</div>
					<div
						ref={resultRef}
						class="flex flex-col p-2 bg-[#15151594] rounded-lg shadow-tb-border-shadow overflow-y-auto absolute"
						classList={{
							"justify-center items-center": !searchMatch(),
							"duration-150": resultOpen(),
							"opacity-0 pointer-events-none translate-y-4 duration-200": !resultOpen(),
						}}
					>
						<h1 class="font-bold text-lg leading-none pt-2 text-[#ffffff68]">Search results</h1>
						<Show
							when={!noResults()}
							fallback={
								<div class="flex gap-1.5 duration-150 items-center text-[#ffffff51]">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-10">
										<path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1.5 14.25h-3v-1.5h3v1.5Zm0-3h-3V7.5h3v5.75Z" />
									</svg>
									<span class="text-sm font-black">No apps or files relevant to searches</span>
								</div>
							}
						>
							<Show
								when={!searchActive()}
								fallback={
									<div class="flex flex-col items-center justify-center gap-1.5 h-full w-full text-[#ffffffa4] font-[680] text-lg">
										Searching...
										<div class="relative flex w-[80%] h-2 rounded-full bg-[#00000020] overflow-hidden shadow-tb-border-shadow">
											<div class="absolute h-full bg-[#50bf66] rounded-full" style={{ animation: "2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite normal none running anim1" }} />
										</div>
									</div>
								}
							>
								<div class="flex flex-col gap-0.5 overflow-y-auto">
									<For each={results()[0]}>
										{app => (
											<div class="flex flex-col gap-2 search-result-app cursor-pointer hover:bg-[#22222288] rounded-md p-2" onClick={() => app.click()}>
												<div class="flex flex-row gap-1 items-center">
													<div innerHTML={app.icon} />
													<div>
														<h1 class="font-extrabold text-xl">{app.name}</h1>
														<h3 class="font-bold text-xs">{app.dir}</h3>
													</div>
												</div>
											</div>
										)}
									</For>
									<For each={results()[1]}>
										{f => (
											<div class="flex flex-col gap-2 search-result-file cursor-pointer hover:bg-[#22222288] rounded-md p-2" onClick={() => f.onClick()}>
												<div class="flex flex-row gap-1 items-center">
													<div innerHTML={f.icon} />
													<div>
														<h1 class="font-extrabold text-xl">{f.name}</h1>
														<h3 class="font-bold text-xs">{f.path}</h3>
													</div>
												</div>
											</div>
										)}
									</For>
								</div>
							</Show>
						</Show>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SearchMenu;
