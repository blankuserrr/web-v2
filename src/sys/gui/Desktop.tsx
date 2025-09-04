import { type Component, createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import DialogContainer from "../apis/Dialogs";
import NotificationContainer from "../apis/Notifications";
import { dirExists, type UserSettings, type WindowConfig } from "../types";
import { clearInfo } from "./AppIsland";
import ContextMenuArea from "./ContextMenu";
import Dock, { type TDockItem } from "./Dock";
import { NotificationMenu } from "./NotificationCenter";
import Shell from "./Shell";
import { WispMenu } from "./Wifi";
import WindowArea from "./WindowArea";
import WinSwitcher from "./WinSwitcher";

interface IDesktopProps {
	desktop: number;
	onContextMenu?: (e: MouseEvent) => void;
}

const Desktop: Component<IDesktopProps> = props => {
	let desktopRef: HTMLDivElement | undefined;
	const [showMenu, setShowMenu] = createSignal(false);
	const [showNotif, setShowNotif] = createSignal(false);
	const [wallpaper, setWallpaper] = createSignal<string | null>(null);
	const [wallpaperMode, setWallpaperMode] = createSignal("cover");
	const [pinned, setPinned] = createSignal<Array<TDockItem>>([]);
	const [winPrev, setWinPrev] = createSignal<{ open: boolean; windows: any; location: string } | null>(null);

	createEffect(() => {
		const menu = () => {
			setShowMenu(prev => !prev);
		};
		const nMenu = () => {
			setShowNotif(prev => !prev);
		};
		const getWallpaper = async () => {
			try {
				const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${await window.tb.user.username()}/settings.json`));
				if (settings.wallpaper.startsWith("/system")) {
					const stream = await Filer.fs.promises.readFile(settings.wallpaper);
					setWallpaper(`data:image/png;base64,${stream.toString("base64")}`);
				} else {
					setWallpaper(settings.wallpaper);
				}
				setWallpaperMode(settings.wallpaperMode);
			} catch (error) {
				console.error("Failed to get wallpaper", error);
			}
		};
		const showWinPrev = (e: CustomEvent) => {
			try {
				setWinPrev(JSON.parse(e.detail));
			} catch (error) {
				console.error("Failed to parse window preview data", error);
			}
		};
		const getPins = async () => {
			if (await dirExists("/system")) {
				try {
					setPinned(JSON.parse(await Filer.fs.promises.readFile("/system/var/terbium/dock.json", "utf8")));
				} catch (error) {
					console.error("Failed to get pinned apps", error);
				}
			}
		};

		getPins();
		getWallpaper();
		window.addEventListener("open-net", menu);
		window.addEventListener("open-notif", nMenu);
		window.addEventListener("load", getWallpaper);
		window.addEventListener("updWallpaper", getWallpaper);
		window.addEventListener("updPins", getPins);
		window.addEventListener("windows-prev", showWinPrev as EventListener);

		onCleanup(() => {
			window.removeEventListener("open-net", menu);
			window.removeEventListener("open-notif", nMenu);
			window.removeEventListener("load", getWallpaper);
			window.removeEventListener("updWallpaper", getWallpaper);
			window.removeEventListener("updPins", getPins);
			window.removeEventListener("windows-prev", showWinPrev as EventListener);
		});
	});

	return (
		<div
			class={"desktop flex flex-col h-[inherit] overflow-hidden "}
			style={{
				"background-image": `url(${wallpaper()})`,
				"background-size": wallpaperMode() === "stretch" ? "100% 100%" : wallpaperMode(),
				"background-position": "center",
				"background-repeat": "no-repeat",
			}}
			data-desktop={props.desktop}
			ref={desktopRef}
			onContextMenu={e => {
				props.onContextMenu?.(e);
			}}
		>
			<Shell />
			<WispMenu isOpen={showMenu()} />
			<WindowArea class="h-full m-2 mt-0" />
			<DialogContainer />
			<NotificationContainer />
			<NotificationMenu isOpen={showNotif()} />
			<ContextMenuArea />
			<WinSwitcher />
			<div class="duration-150" classList={{ "opacity-100": winPrev()?.open, "opacity-0": !winPrev()?.open }}>
				<Show when={winPrev()?.windows && winPrev()?.windows.length > 0}>
					<div class={"absolute bottom-16 flex flex-col justify-center items-center rounded-lg bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-[100px] border-none overflow-hidden z-9999999"} style={{ left: `calc(${winPrev()?.location}px - ${45 * winPrev()?.windows.length}px)` }}>
						<For each={winPrev()?.windows[0]}>
							{(win: WindowConfig) => (
								<div
									classList={{
										"bg-[#ffffff18]": win.pid === String(window.tb.window.getId()),
									}}
									class={"flex justify-center items-center p-2 gap-14 hover:bg-[#ffffff10] duration-150"}
									onClick={() => {
										window.dispatchEvent(new CustomEvent("sel-win", { detail: win.wid }));
										window.dispatchEvent(new CustomEvent("currWID", { detail: win.wid }));
										setWinPrev(prev => ({
											...prev!,
											open: true,
										}));
									}}
								>
									<div class="flex items-center gap-2">
										<img src={win.icon} class="size-6" alt="App icon" />
										<h2>{typeof win.title === "string" ? win.title : win.title?.text}</h2>
									</div>
									<svg
										class="size-6 p-0.5 rounded-sm cursor-pointer text-[#ffffffbb] no-drag hover:text-white hover:bg-[#ffffff10]"
										viewBox="0 0 24 24"
										fill="none"
										onClick={() => {
											window.tb.process.kill(win.pid);
											setWinPrev(prev => {
												if (!prev) return null;
												const newWindows = prev.windows.map((w: any) => w.filter((w: WindowConfig) => w.wid !== win.wid));
												return {
													...prev,
													windows: newWindows,
												};
											});
											clearInfo();
										}}
									>
										<path class="duration-150 pointer-events-none" d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</div>
							)}
						</For>
					</div>
				</Show>
			</div>
			<Dock pinned={pinned()} />
		</div>
	);
};

export const createDesktop = (amount: number, _container: HTMLElement) => {
	for (let i = 0; i < amount; i++) {
		// This is not standard SolidJS, rendering into a container is usually done via `render` from `solid-js/web`
		// I will leave this as is, assuming there is a custom renderer or this will be adapted.
		// render(() => <Desktop desktop={i} />, container);
	}
};

export default Desktop;
