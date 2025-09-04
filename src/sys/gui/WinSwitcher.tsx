import { createSignal, onMount, onCleanup } from "solid-js";
import { For } from "solid-js";
import "./styles/win_switcher.css";
import { useWindowStore } from "../Store";
import type { WindowConfig } from "../types";

const WinSwitcher = () => {
	const [isVisible, setIsVisible] = createSignal<boolean>(false);
	const [activeIndex, setActiveIndex] = createSignal<number>(0);
	const windowStore = useWindowStore();

	onMount(() => {
		const os = navigator.userAgent;
		let switcherTimer: NodeJS.Timeout;

		const onDown = (e: KeyboardEvent) => {
			if (os.includes("Mac") ? e.metaKey && e.shiftKey && e.key === "Tab" : e.key === "Tab" && e.shiftKey) {
				e.preventDefault();
				showSwitch();
			} else if (isVisible() && e.key === "Tab") {
				e.preventDefault();
				onSwitch(1);
			}
		};

		const onUp = (e: KeyboardEvent) => {
			if (os.includes("Mac") ? e.metaKey && e.shiftKey && e.key === "Tab" : e.key === "Tab" || !e.shiftKey) {
				e.preventDefault();
				clearTimeout(switcherTimer);
				switcherTimer = setTimeout(() => {
					setIsVisible(false);
				}, 1000);
			}
		};

		const showSwitch = () => {
			setIsVisible(true);
			setActiveIndex(0);
			clearTimeout(switcherTimer);
			switcherTimer = setTimeout(() => {
				setIsVisible(false);
			}, 1000);
		};

		const onSwitch = (direction: number) => {
			if (windowStore.windows.length > 0) {
				const nextIndex = (activeIndex() + direction + windowStore.windows.length) % windowStore.windows.length;
				setActiveIndex(nextIndex);
				const win = windowStore.windows[nextIndex];
				console.log(win);
				window.dispatchEvent(new CustomEvent("sel-win", { detail: win.wid }));
			}
		};

		window.addEventListener("keydown", onDown);
		window.addEventListener("keyup", onUp);

		onCleanup(() => {
			window.removeEventListener("keydown", onDown);
			window.removeEventListener("keyup", onUp);
			clearTimeout(switcherTimer);
		});
	});

	return (
		<div class={`win-switcher absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-[10px] px-[14px] bg-[#00000028] backdrop-blur-[100px] rounded-[10px] z-999999999 opacity-${isVisible() ? "100" : "0"} duration-150 pointer-events-${isVisible() ? "auto" : "none"}`}>
			<For each={windowStore.windows}>
				{(window: WindowConfig, index) => (
					<div data-index={index()} class={`window-item ${index() === activeIndex() ? "active" : ""}`}>
						{window.icon && <img src={window.icon} alt={typeof window.title === "string" ? window.title : window.title.text} class="icon" />}
						{typeof window.title === "string" ? window.title : window.title.text}
					</div>
				)}
			</For>
		</div>
	);
};

export default WinSwitcher;
