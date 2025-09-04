import { Icon } from "solid-heroicons";
import { chevronRight, magnifyingGlass, puzzlePiece } from "solid-heroicons/outline";
import { type Component, createEffect, createSignal, For, type JSX, onCleanup, Show } from "solid-js";
import { useSearchMenuStore, useWindowStore } from "../Store";
import { dirExists, Filer, isURL, type WindowConfig } from "../types";
import SearchMenu from "./Search";
import "./styles/dock.css";

export type TDockItem = {
	className?: string;
	title: string;
	icon: string | undefined;
	src: string;
	size?: number[] | any;
	children?: Array<TDockItem>;
	isPinnable?: boolean;
	snapable?: boolean;
	pid?: string;
	wid?: string;
	proxy?: boolean;
	user?: string;
	onClick?: (e: MouseEvent) => void;
	onContextMenu?: (e: MouseEvent) => void;
};

export type TStartItem = {
	title: string;
	icon: string | JSX.Element | undefined;
	pid: string | undefined;
	onClick?: (e: MouseEvent) => void;
	inPins?: boolean;
	className?: string;
	src?: string;
	proxy?: boolean;
};

interface IDockProps {
	showPins?: boolean;
	pinned: Array<TDockItem> | null;
}

interface IUser {
	pfp: string | undefined;
	username: string | undefined;
}

const Dock: Component<IDockProps> = props => {
	const windowStore = useWindowStore();
	const searchMenuStore = useSearchMenuStore();

	const [isStartOpen, setStartOpen] = createSignal<boolean>(false);
	const [user, setUser] = createSignal<IUser>({
		pfp: undefined,
		username: undefined,
	});

	let startRef: HTMLDivElement | undefined;
	let searchRef: HTMLInputElement | undefined;
	let searchDockRef: HTMLDivElement | undefined;
	const [searchHasText, setSearchHasText] = createSignal<boolean>(false);
	const [searchActive, setSearchActive] = createSignal<boolean>(false);
	let placeholderRef: HTMLSpanElement | undefined;
	let openAppsRef: HTMLDivElement | undefined;
	let startButtonRef: SVGSVGElement | undefined;
	let systemAppsRef: HTMLDivElement | undefined;
	let pinnedAppsRef: HTMLDivElement | undefined;
	let searchMatchRef: HTMLDivElement | undefined;
	let userOptsRef: HTMLDivElement | undefined;
	const [searchMatch, setSearchMatch] = createSignal<boolean>(false);
	const [systemApps, setSysApps] = createSignal<Array<TDockItem>>([]);
	const [pins, setPins] = createSignal<Array<TDockItem>>([]);

	createEffect(() => {
		const fetchData = async () => {
			if (await dirExists("/system")) {
				try {
					const startConfig = JSON.parse(await Filer.promises.readFile("/system/var/terbium/start.json", "utf8"));
					setSysApps(startConfig.system_apps);
					setPins(startConfig.pinned_apps);
				} catch (error) {
					console.error("Failed to fetch start menu data", error);
				}
			}
		};
		fetchData();
		window.addEventListener("updApps", fetchData);
		onCleanup(() => window.removeEventListener("updApps", fetchData));
	});

	createEffect(() => {
		const fetchUser = async () => {
			try {
				const pfp = await window.tb.user.pfp();
				const username = await window.tb.user.username();
				setUser({ pfp, username });
			} catch (error) {
				console.error("Failed to fetch user data", error);
			}
		};
		window.addEventListener("accUpd", fetchUser);
		fetchUser();
		onCleanup(() => window.removeEventListener("accUpd", fetchUser));
	});

	const filteredSysApps = () => systemApps().filter((item, index, self) => index === self.findIndex(t => t.title === item.title && t.icon === item.icon && t.src === item.src) && (!item.user || item.user === user().username));

	const filteredPins = () => (props.pinned || []).filter((item, index, self) => index === self.findIndex(t => t.src === item.src && t.title === item.title && t.icon === item.icon));

	const resetSearch = () => {
		setSearchHasText(false);
		setSearchMatch(false);
		if (searchRef) {
			searchRef.value = "";
		}
		const systemApps = systemAppsRef;
		const pinnedApps = pinnedAppsRef;
		if (systemApps && pinnedApps) {
			Array.from(systemApps.children).forEach(child => child.classList.remove("hidden", "-translate-x-2", "opacity-0"));
			Array.from(pinnedApps.children).forEach(child => child.classList.remove("hidden", "-translate-x-2", "opacity-0"));
		}
	};

	const openStart = (focusSearch?: boolean | null, close?: boolean) => {
		if (close) {
			setStartOpen(false);
			resetSearch();
			return;
		}

		const clickElsewhere = (e: MouseEvent) => {
			if (e.target !== startRef && e.target !== startButtonRef && !startRef?.contains(e.target as Node) && !searchDockRef?.contains(e.target as Node)) {
				setStartOpen(false);
				resetSearch();
				window.removeEventListener("mousedown", clickElsewhere);
			}
		};

		window.addEventListener("mousedown", clickElsewhere);
		setStartOpen(prev => !prev);
		openSearchMenu(true);
		if (focusSearch) {
			setTimeout(() => searchRef?.focus(), 150);
		}
		setTimeout(resetSearch, 200);
	};

	const openSearchMenu = (close?: boolean) => {
		if (close) {
			searchMenuStore.setOpen(false);
			return;
		}

		const clickElsewhere = (e: MouseEvent) => {
			if (e.target !== searchDockRef && e.target !== startButtonRef && !searchDockRef?.contains(e.target as Node) && !searchMenuStore.searchMenuRef.current?.contains(e.target as Node)) {
				searchMenuStore.setOpen(false);
				window.removeEventListener("mousedown", clickElsewhere);
			}
		};

		window.addEventListener("mousedown", clickElsewhere);
		searchMenuStore.setOpen(!searchMenuStore.open);
		openStart(null, true);
	};

	return (
		<div class="fixed bottom-0 left-0 right-0 flex flex-col justify-center items-center pb-[6px] z-9999999">
			<SearchMenu className={`absolute ${searchMenuStore.open ? "bottom-[calc(12px+48px)] duration-150" : "opacity-0 pointer-events-none bottom-[40px] duration-200"}`} />
			<div
				ref={startRef}
				class="absolute flex flex-col bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-sm rounded-xl overflow-hidden w-max min-w-[440px] h-max min-h-[200px] ease-in"
				classList={{
					"bottom-[calc(12px+48px)] duration-150": isStartOpen(),
					"opacity-0 pointer-events-none bottom-[40px] duration-200": !isStartOpen(),
					"scale-110": searchHasText(),
				}}
				style={{ "background-image": "url(/assets/img/grain.png)" }}
			>
				<div
					class="flex gap-2 items-center p-2 pb-0 text-[#ffffffa4] duration-700"
					classList={{
						"": isStartOpen(),
						"translate-y-2 opacity-0": !isStartOpen(),
					}}
				>
					<Icon path={magnifyingGlass} class="size-6 text-[#ffffff86] stroke-current stroke-[2px]" />
					<div class="relative flex items-center w-full">
						<span
							ref={placeholderRef}
							class="absolute font-[680] text-lg pointer-events-none duration-150"
							classList={{
								"opacity-0 -translate-x-8": searchHasText(),
								"opacity-100": searchActive(),
								"opacity-75": !searchHasText() && !searchActive(),
							}}
						>
							Search
						</span>
						<input
							ref={searchRef}
							class="bg-transparent focus-within:outline-hidden text-lg font-[680] cursor-[var(--cursor-text)] w-full"
							type="text"
							onFocus={() => setSearchActive(true)}
							onBlur={() => setSearchActive(false)}
							onInput={(e: any) => {
								const value = e.target.value;
								setSearchHasText(value.length > 0);
								const query = value.toLowerCase();
								const systemApps = systemAppsRef;
								const pinnedApps = pinnedAppsRef;
								if (systemApps && pinnedApps) {
									let systemAppsMatch = 0;
									let pinnedAppsMatch = 0;

									Array.from(systemApps.children).forEach((child: Element) => {
										if (child.textContent?.toLowerCase().includes(query)) {
											child.classList.remove("hidden");
											setTimeout(() => child.classList.remove("opacity-0", "-translate-x-2"), 150);
											systemAppsMatch++;
										} else {
											child.classList.add("-translate-x-2", "opacity-0");
											setTimeout(() => child.classList.add("hidden"), 150);
										}
									});

									Array.from(pinnedApps.children).forEach((child: Element) => {
										if (child.textContent?.toLowerCase().includes(query)) {
											child.classList.remove("hidden");
											setTimeout(() => child.classList.remove("opacity-0", "-translate-x-2"), 150);
											pinnedAppsMatch++;
										} else {
											child.classList.add("-translate-x-2", "opacity-0");
											setTimeout(() => child.classList.add("hidden"), 150);
										}
									});

									setSearchMatch(systemAppsMatch === 0 && pinnedAppsMatch === 0);
								}
							}}
						/>
					</div>
				</div>
				<div
					class="relative flex min-h-[104px] overflow-y-auto max-h-[196px] w-full gap-2 p-2 pt-0 duration-1000"
					classList={{
						"": isStartOpen(),
						"translate-y-4 opacity-0": !isStartOpen(),
						"justify-center": searchMatch(),
						"justify-between": !searchMatch(),
					}}
				>
					<div
						ref={systemAppsRef}
						class="grid gap-1 overflow-y-auto"
						classList={{
							"max-h-[188px] grid-cols-2": pins().length > 0,
							"w-full grid-cols-3": pins().length === 0,
						}}
					>
						<For each={filteredSysApps()}>
							{item => (
								<StartItem
									title={item.title}
									icon={item.icon}
									pid={undefined}
									src={item.src}
									onClick={() => {
										item.onClick?.(new MouseEvent("click"));
										windowStore.addWindow({
											src: item.src,
											size: item.size,
											icon: typeof item.icon === "string" ? item.icon : undefined,
											title: item.title,
											proxy: item.proxy,
											snapable: item.snapable,
										});
										setStartOpen(false);
									}}
								/>
							)}
						</For>
					</div>
					<Show when={pins().length > 0}>
						<div class="flex flex-col gap-2 h-full">
							<span class="font-semibold">Pinned Apps</span>
							<div ref={pinnedAppsRef} class="flex flex-col bg-[#ffffff10] max-h-[200px] overflow-y-auto w-max rounded-lg last:rounded-b-lgration-1000">
								<For each={pins()}>
									{item => (
										<StartItem
											className="first:rounded-t-lg last:rounded-b-lg"
											inPins
											pid={undefined}
											title={item.title}
											icon={item.icon}
											onClick={(e: MouseEvent) => {
												if (e.button === 0) item.onClick?.(new MouseEvent("click"));
												windowStore.addWindow({
													src: item.src,
													icon: typeof item.icon === "string" ? item.icon : undefined,
													size: item.size,
													title: item.title,
													proxy: item.proxy,
													snapable: item.snapable,
												});
												setStartOpen(false);
											}}
										/>
									)}
								</For>
							</div>
						</div>
					</Show>
					<div
						ref={searchMatchRef}
						class="absolute top-1/2 left-1/2 -translate-1/2 flex gap-1.5 duration-150"
						classList={{
							"": searchMatch(),
							"opacity-0 pointer-events-none -translate-x-3": !searchMatch(),
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
							<path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1.5 14.25h-3v-1.5h3v1.5Zm0-3h-3V7.5h3v5.75Z" />
						</svg>
						<span class="text-sm">No results found</span>
					</div>
				</div>
				<div ref={userOptsRef} class="flex items-center gap-2 p-2 bg-[#00000048] rounded-b-lg last:rounded-b-lg">
					<div
						class="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#ffffff19] hover:scale-95 duration-150 cursor-pointer"
						onClick={() => {
							window.tb.contextmenu.create({
								x: userOptsRef?.getBoundingClientRect().x ?? 0,
								y: userOptsRef ? userOptsRef.getBoundingClientRect().y - 75 : 0,
								options: [
									{
										text: "Manage Account",
										click: () => {
											window.tb.window.create({
												title: "Settings",
												src: "/fs/apps/system/settings.tapp/index.html",
												icon: "/fs/apps/system/settings.tapp/icon.svg",
												single: true,
												message: JSON.stringify({ page: "privacy" }),
											});
										},
									},
									{
										text: "Sign out",
										click: () => {
											sessionStorage.setItem("logged-in", "false");
											window.location.reload();
										},
									},
								],
							});
						}}
					>
						<img class="size-8 rounded-full pointer-events-none" src={user().pfp} alt={user().username} />
						<span class="font-bold text-lg pointer-events-none">{user().username}</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-[#ffffff58]">
						<span
							class="font-medium hover:text-[#ffffff98] cursor-pointer duration-150"
							onClick={() => {
								window.tb.window.create({
									title: "Settings",
									src: "/fs/apps/system/settings.tapp/index.html",
									icon: "/fs/apps/system/settings.tapp/icon.svg",
								});
								setStartOpen(false);
							}}
						>
							Settings
						</span>
						<span
							class="font-medium hover:text-[#ffffff98] cursor-pointer duration-150"
							onClick={() => {
								window.tb.window.create({
									title: "About",
									src: "/fs/apps/system/about.tapp/index.html",
									icon: "/fs/apps/system/about.tapp/icon.svg",
								});
								setStartOpen(false);
							}}
						>
							About
						</span>
						<span
							class="font-medium hover:text-[#ffffff98] cursor-pointer duration-150"
							onClick={() => {
								sessionStorage.setItem("ldir", `/home/${user().username}/Documents`);
								window.tb.window.create({
									title: "Files",
									icon: "/fs/apps/system/files.tapp/icon.svg",
									src: "/fs/apps/system/files.tapp/index.html",
									size: {
										width: 600,
										height: 500,
									},
								});
								setStartOpen(false);
							}}
						>
							Documents
						</span>
					</div>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1.5 shadow-tb-border-shadow backdrop-blur-[8px] bg-[#2020208c] p-2 rounded-[8px]">
					<svg ref={startButtonRef} viewBox="0 0 24 24" fill="currentColor" class="cursor-pointer w-7 h-7" onClick={() => openStart(false)}>
						<path
							class="pointer-events-none"
							fill-rule="evenodd"
							d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z"
							clip-rule="evenodd"
						/>
					</svg>
					<div ref={searchDockRef} class="flex items-center min-w-34 gap-1 p-2 bg-[#ffffff10] rounded-full cursor-text shadow-tb-border-shadow" onMouseDown={() => openSearchMenu()}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4 text-[#ffffffb9] pointer-events-none stroke-2 stroke-current">
							<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clip-rule="evenodd" />
						</svg>
						<span class="leading-none text-[#ffffffa6] font-bold pointer-events-none select-none">Search</span>
					</div>
				</div>
				<div
					ref={openAppsRef}
					class="shadow-tb-border-shadow backdrop-blur-[8px] bg-[#2020208c] flex items-center gap-2 py-1.5 px-2 rounded-[8px] duration-150 ease-in"
					classList={{
						"translate-x-0 opacity-100": props.pinned != null && ((props.pinned.length > 0 && windowStore.windows.length > 0) || props.pinned.length > 0 || windowStore.windows.length > 0),
						"translate-y-3 opacity-0 pointer-events-none": props.pinned == null || !((props.pinned.length > 0 && windowStore.windows.length > 0) || props.pinned.length > 0 || windowStore.windows.length > 0),
					}}
					style={{ "background-image": "url(/assets/img/grain.png)" }}
				>
					<Show when={props.pinned != null && props.pinned.length > 0}>
						<div class="flex items-center">
							<For each={filteredPins()}>
								{item => (
									<PinnedDockItem
										src={item.src}
										title={item.title}
										icon={item.icon ?? "/assets/img/null.svg"}
										size={item.size}
										proxy={item.proxy}
										snapable={item.snapable}
										onContextMenu={(e: MouseEvent) => {
											e.preventDefault();
										}}
									/>
								)}
							</For>
						</div>
					</Show>
					<Show when={(props.pinned?.length ?? 0) > 0 && windowStore.windows.length > 0}>
						<span class="flex bg-[#ffffff38] backdrop-blur-[20px] h-[20px] w-1 rounded-full" />
					</Show>
					<div
						class="flex items-center gap-0.5"
						classList={{
							flex: windowStore.windows.length > 0,
							hidden: windowStore.windows.length === 0,
						}}
					>
						<For each={windowStore.windows.filter((item, index, self) => index === self.findIndex(t => (typeof t.title === "string" ? t.title : t.title?.text) === (typeof item.title === "string" ? item.title : item.title?.text)))}>
							{item => <DockItem src={item.src} title={typeof item.title === "string" ? item.title : item.title?.text} icon={item.icon ?? "/assets/img/null.svg"} size={item.size} proxy={item.proxy} wid={item.wid} pid={item.pid} />}
						</For>
					</div>
				</div>
			</div>
		</div>
	);
};

const DockItem: Component<TDockItem> = props => {
	const windowStore = useWindowStore();
	let dockItemRef: HTMLElement | undefined;
	const [currWID, setCurrWID] = createSignal(props.wid);
	const [winfocused, setWinfocused] = createSignal(windowStore.windows.find((w: any) => w.wid === currWID())?.focused);

	const mm = (e: MouseEvent) => {
		if (!dockItemRef) return;
		const rect = dockItemRef.getBoundingClientRect();
		const xDistance = Math.abs(e.clientX - (rect.left + rect.width / 2));
		const yDistance = Math.abs(e.clientY - (rect.top + rect.height / 2));
		const distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
		if (distance > 350) {
			window.removeEventListener("mousemove", mm);
			window.dispatchEvent(new CustomEvent("windows-prev", { detail: JSON.stringify({ open: false, location: null }) }));
		}
	};

	createEffect(() => {
		const setWID = (e: CustomEvent) => {
			setCurrWID(e.detail);
			setWinfocused(windowStore.windows.find((w: any) => w.wid === e.detail)?.focused);
		};
		const updsel = (e: CustomEvent) => {
			if (e.detail !== props.title) {
				setWinfocused(false);
			} else {
				setWinfocused(true);
			}
		};
		window.addEventListener("selwin-upd", updsel as EventListener);
		window.addEventListener("currWID", setWID as EventListener);

		onCleanup(() => {
			window.removeEventListener("currWID", setWID as EventListener);
			window.removeEventListener("selwin-upd", updsel as EventListener);
			window.removeEventListener("mousemove", mm);
		});
	});

	return (
		<dock-item
			ref={dockItemRef}
			wid={props.wid}
			class={props.className ? `${props.className} cursor-pointer p-1 hover:bg-[#ffffff28] rounded-md duration-100 ease-in select-none` : `cursor-pointer p-1 hover:bg-[#ffffff28] rounded-md duration-100 ease-in select-none ${winfocused() ? "bg-[#ffffff28] shadow-tb-border-shadow" : ""}`}
			onMouseEnter={() => {
				setTimeout(() => {
					const rect = dockItemRef?.getBoundingClientRect();
					const x = rect ? rect.x : 0;
					window.addEventListener("mousemove", mm);
					window.dispatchEvent(
						new CustomEvent("windows-prev", {
							detail: JSON.stringify({
								open: true,
								windows: [
									windowStore.matchedWindows.find((group: any[]) =>
										group.some((w: WindowConfig) => {
											if (typeof w.title === "string") {
												return w.title === props.title;
											}
											if (w.title?.text) {
												return w.title.text === props.title;
											}
											return false;
										}),
									),
								],
								location: x,
							}),
						}),
					);
				}, 950);
			}}
			onClick={() => {
				props.onClick?.(new MouseEvent("click"));
				window.dispatchEvent(new CustomEvent("sel-win", { detail: currWID() }));
			}}
			onContextMenu={(e: MouseEvent) => {
				e.preventDefault();
				props.onContextMenu?.(new MouseEvent("contextmenu"));
				const { clientX, clientY } = e;
				window.tb.contextmenu.create({
					x: clientX - 10,
					y: clientY - 150,
					options: [
						{
							text: "New Window",
							click: () => {
								windowStore.addWindow({
									src: props.src,
									icon: typeof props.icon === "string" ? props.icon : undefined,
									size: props.size,
									title: props.title,
									proxy: props.proxy,
									snapable: props.snapable,
								});
							},
						},
						{
							text: "Pin",
							click: () => {
								window.tb.desktop.dock.pin({
									src: props.src,
									icon: typeof props.icon === "string" ? props.icon : undefined,
									size: props.size,
									title: props.title,
									snapable: props.snapable,
								});
							},
						},
						{
							text: "Close",
							click: () => {
								window.tb.process.kill(props.pid);
							},
						},
					],
				});
			}}
		>
			<Show when={typeof props.icon === "string"} fallback={<div class="w-7 h-7 flex items-center justify-center pointer-events-none">{props.icon}</div>}>
				<img src={props.icon || "/assets/img/null.svg"} alt={props.title} class="w-7 h-7 flex items-center justify-center pointer-events-none" />
			</Show>
		</dock-item>
	);
};

const PinnedDockItem: Component<TDockItem> = props => {
	const windowStore = useWindowStore();
	return (
		<dock-item
			class={props.className ? `${props.className} cursor-pointer p-1 hover:bg-[#ffffff28] rounded-md duration-100 ease-in select-none` : "cursor-pointer p-1 hover:bg-[#ffffff28] rounded-md duration-100 ease-in select-none"}
			title={props.title}
			onClick={() => {
				props.onClick?.(new MouseEvent("click"));
				windowStore.addWindow({
					src: props.src,
					icon: typeof props.icon === "string" ? props.icon : undefined,
					size: props.size,
					title: props.title,
					proxy: props.proxy,
					snapable: props.snapable,
				});
			}}
			onContextMenu={(e: MouseEvent) => {
				e.preventDefault();
				props.onContextMenu?.(new MouseEvent("contextmenu"));
				const { clientX, clientY } = e;
				window.tb.contextmenu.create({
					x: clientX - 10,
					y: clientY - 100,
					options: [
						{
							text: "New Window",
							click: () => {
								windowStore.addWindow({
									src: props.src,
									icon: typeof props.icon === "string" ? props.icon : undefined,
									size: props.size,
									title: props.title,
									proxy: props.proxy,
									snapable: props.snapable,
								});
							},
						},
						{
							text: "Unpin from Dock",
							click: () => {
								window.tb.desktop.dock.unpin(props.title);
							},
						},
					],
				});
			}}
		>
			<Show when={typeof props.icon === "string"} fallback={<div class="w-7 h-7 flex items-center justify-center pointer-events-none">{props.icon}</div>}>
				<img src={props.icon || "/assets/img/null.svg"} alt={props.title} class="w-7 h-7 flex items-center justify-center pointer-events-none" />
			</Show>
		</dock-item>
	);
};

export const StartItem: Component<TStartItem> = props => {
	const [resolvedIcon, setResolvedIcon] = createSignal<boolean>(false);
	const titleText = () => (typeof props.title === "string" ? props.title : props.title?.text || "");
	const chars = () => titleText().split("");

	const sysapps = ["Terminal", "Files", "Settings", "App Store", "Browser", "Calculator", "Feedback", "About", "Text Editor", "Task Manager", "Anura File Manager"];
	const isSystemApp = () => sysapps.includes(titleText());

	createEffect(() => {
		const checkIcon = async () => {
			const icon = props.icon;
			if (typeof icon === "string") {
				if (icon.startsWith("/")) {
					try {
						const url = icon.match(isURL) ? icon : `${window.location.origin}${icon}`;
						const response = await fetch(url);
						if (response.ok) {
							const data = await response.text();
							setResolvedIcon(!data.startsWith("<!"));
							return;
						}
					} catch {
						// fall through to set false
					}
				} else {
					setResolvedIcon(true);
					return;
				}
			}
			setResolvedIcon(false);
		};
		checkIcon();
	});

	return (
		<Show
			when={props.inPins}
			fallback={
				<div
					class={`${props.className || ""} group p-2 pr-2.5 gap-2 flex justify-between items-center hover:bg-[#ffffff28] hover:shadow-tb-border duration-150 cursor-pointer rounded-lg w-full`}
					onClick={e => {
						if (e.button === 0) props.onClick?.(new MouseEvent("click"));
					}}
					onContextMenu={async (e: MouseEvent) => {
						e.preventDefault();
						const { clientX, clientY } = e;
						const appsStart: any = JSON.parse(await Filer.promises.readFile("/system/var/terbium/start.json", "utf8"));
						const appsDock: any = JSON.parse(await Filer.promises.readFile("/system/var/terbium/dock.json", "utf8"));
						const isPinnedStart = appsStart.pinned_apps.some((app: any) => app.title === props.title && app.icon === props.icon);
						const isPinnedDock = appsDock.some((app: any) => app.src === props.src && app.icon === props.icon);
						window.tb.contextmenu.create({
							x: clientX - 10,
							y: clientY - 150,
							options: [
								{ text: "Open", click: () => props.onClick?.(new MouseEvent("click")) },
								isPinnedDock
									? { text: "Unpin from Dock", click: () => window.tb.desktop.dock.unpin(props.title) }
									: {
											text: "Pin to Dock",
											click: async () => {
												let configData: any = {};
												try {
													const data = JSON.parse(await Filer.promises.readFile(`/apps/system/${titleText().toLowerCase()}.tapp/index.json`));
													configData = data.config;
												} catch (_e) {
													configData = { title: titleText(), icon: typeof props.icon === "string" ? props.icon : undefined, isPinnable: true, src: props.src };
												}
												window.tb.desktop.dock.pin(configData);
											},
										},
								isPinnedStart
									? {
											text: "Unpin from Start",
											click: async () => {
												const apps: any = JSON.parse(await Filer.promises.readFile("/system/var/terbium/start.json", "utf8"));
												apps.pinned_apps = apps.pinned_apps.filter((app: any) => !(app.title === props.title && app.icon === props.icon));
												await Filer.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
												window.dispatchEvent(new Event("updApps"));
											},
										}
									: {
											text: "Pin to Start",
											click: async () => {
												const path = props.src
													?.replace("/fs", "")
													.replace(/\/[^/]+\.html$/, "/")
													.replace(/\/\.\//, "/");
												if (path) {
													const appConfig = JSON.parse(await Filer.promises.readFile(`${path}index.json`, "utf8"));
													if (!appsStart.pinned_apps.some((app: any) => app.title === appConfig.config.title && app.icon === appConfig.config.icon)) {
														appsStart.pinned_apps.push({ name: typeof appConfig.config.title === "string" ? appConfig.config.title : appConfig.config.title.text, ...appConfig.config });
														await Filer.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(appsStart, null, 2));
														window.dispatchEvent(new Event("updApps"));
													}
												}
											},
										},
								...(isSystemApp()
									? []
									: [
											{
												text: "Uninstall",
												click: async () => {
													const appName = titleText();
													let appPath = `/apps/user/${await window.tb.user.username()}/${appName.toLowerCase()}`;
													if (props.src?.includes(".tapp")) {
														appPath += ".tapp";
													}
													let installedApps = JSON.parse(await Filer.promises.readFile("/apps/installed.json", "utf8"));
													installedApps = installedApps.filter((app: any) => app.title !== props.title);
													await Filer.promises.writeFile("/apps/installed.json", JSON.stringify(installedApps));
													await new Filer.Shell().promises.rm(appPath, { recursive: true });
													await window.tb.launcher.removeApp(chars());
													window.dispatchEvent(new Event("updApps"));
												},
											},
										]),
							],
						});
					}}
				>
					<div class="flex gap-2 items-center">
						<Show
							when={resolvedIcon()}
							fallback={
								<div class="w-7 h-7 flex items-center justify-center">
									<Icon path={puzzlePiece} class="size-7" />
								</div>
							}
						>
							<img src={props.icon as string} class="w-7 h-7 flex items-center justify-center" />
						</Show>
						<span class="text-white font-[680]">{chars().length > 10 ? `${chars().slice(0, 10).join("")}...` : chars().join("")}</span>
					</div>
					<Icon
						path={chevronRight}
						class="size-7 bg-[#ffffff18] backdrop-blur-[20px] shadow-tb-border-shadow p-1.5 rounded-full text-white stroke-current stroke-[3px] opacity-0 group-hover:opacity-100 duration-150 ease-in"
						onClick={async () => {
							const apps: any = JSON.parse(await Filer.promises.readFile("/system/var/terbium/start.json", "utf8"));
							apps.pinned_apps.push({ title: props.title, icon: props.icon, src: props.src });
							await Filer.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
							window.dispatchEvent(new Event("updApps"));
						}}
					/>
				</div>
			}
		>
			<div
				class={`${props.className || ""} group p-2 pr-2.5 gap-4 flex justify-between items-center hover:bg-[#ffffff28] hover:shadow-tb-border duration-150 cursor-pointer w-full`}
				onClick={() => props.onClick?.(new MouseEvent("click"))}
				onContextMenu={(e: MouseEvent) => {
					e.preventDefault();
					const { clientX, clientY } = e;
					window.tb.contextmenu.create({
						x: clientX - 10,
						y: clientY - 150,
						options: [
							{ text: "Open", click: () => props.onClick?.(new MouseEvent("click")) },
							{
								text: "Pin to Dock",
								click: async () => {
									let configData: any = {};
									try {
										const data = JSON.parse(await Filer.promises.readFile(`/apps/system/${titleText().toLowerCase()}.tapp/index.json`));
										configData = data.config;
									} catch (_e) {
										configData = { title: titleText(), icon: typeof props.icon === "string" ? props.icon : undefined, isPinnable: true, src: props.src };
									}
									window.tb.desktop.dock.pin(configData);
								},
							},
							{
								text: "Unpin from Start",
								click: async () => {
									const apps: any = JSON.parse(await Filer.promises.readFile("/system/var/terbium/start.json", "utf8"));
									apps.pinned_apps = apps.pinned_apps.filter((app: any) => !(app.title === props.title && app.icon === props.icon));
									await Filer.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
									window.dispatchEvent(new Event("updApps"));
								},
							},
							...(isSystemApp()
								? []
								: [
										{
											text: "Uninstall",
											click: async () => {
												const appName = titleText();
												let appPath = `/apps/user/${await window.tb.user.username()}/${appName.toLowerCase()}`;
												if (props.src?.includes(".tapp")) {
													appPath += ".tapp";
												}
												let installedApps = JSON.parse(await Filer.promises.readFile("/apps/installed.json", "utf8"));
												installedApps = installedApps.filter((app: any) => app.title !== props.title);
												await Filer.promises.writeFile("/apps/installed.json", JSON.stringify(installedApps));
												await new Filer.Shell().promises.rm(appPath, { recursive: true });
												await window.tb.launcher.removeApp(chars());
												window.dispatchEvent(new Event("updApps"));
											},
										},
									]),
						],
					});
				}}
			>
				<div class="flex gap-2 items-center">
					<Show
						when={resolvedIcon()}
						fallback={
							<div class="w-7 h-7 flex items-center justify-center">
								<Icon path={puzzlePiece} class="size-7" />
							</div>
						}
					>
						<img src={props.icon as string} class="w-7 h-7 flex items-center justify-center" />
					</Show>
					<span class="text-white font-[680]">{chars().length > 10 ? `${chars().slice(0, 10).join("")}...` : chars().join("")}</span>
				</div>
				<Icon
					path={chevronRight}
					class="size-7 bg-[#ffffff18] backdrop-blur-[20px] shadow-tb-border-shadow p-1.5 rounded-full text-white stroke-current stroke-[3px] opacity-0 group-hover:opacity-100 duration-150 ease-in"
					onClick={async () => {
						const apps: any = JSON.parse(await Filer.promises.readFile("/system/var/terbium/start.json", "utf8"));
						apps.pinned_apps = apps.pinned_apps.filter((app: any) => !(app.title === props.title && app.icon === props.icon));
						await Filer.promises.writeFile("/system/var/terbium/start.json", JSON.stringify(apps, null, 2));
						window.dispatchEvent(new Event("updApps"));
					}}
				/>
			</div>
		</Show>
	);
};

export default Dock;
