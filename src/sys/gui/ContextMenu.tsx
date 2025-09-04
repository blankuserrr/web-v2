import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { useContextMenuStore } from "../Store";
import "./styles/contextmenu.css";

const ContextMenuArea = () => {
	const contextMenuStore = useContextMenuStore();
	let menuAreaRef: HTMLDivElement | undefined;
	let menuRef: HTMLDivElement | undefined;
	const [menuOpen, setMenuOpen] = createSignal(false);

	createEffect(() => {
		const ctx = (e: CustomEvent) => {
			contextMenuStore.setContextMenu(e.detail.props);
			setTimeout(() => {
				setMenuOpen(true);
			}, 50);
		};
		const withinRadius = (e: MouseEvent) => {
			if (!menuRef) return false;
			const rect = menuRef.getBoundingClientRect();
			const xBound = e.clientX >= rect.left - 75 && e.clientX <= rect.right + 75;
			const yBound = e.clientY >= rect.top - 75 && e.clientY <= rect.bottom + 75;
			return xBound && yBound;
		};
		const onDown = (e: MouseEvent) => {
			if (e.button === 0) {
				if (menuRef && !menuRef.contains(e.target as Node) && !withinRadius(e)) {
					setMenuOpen(false);
					setTimeout(() => {
						contextMenuStore.clearContextMenu();
					}, 150);
				}
			}
		};
		const close = () => {
			setMenuOpen(false);
			setTimeout(() => {
				contextMenuStore.clearContextMenu();
			}, 1000);
		};
		window.addEventListener("ctxm", ctx as unknown as EventListener);
		window.addEventListener("close-ctxm", close);
		document.addEventListener("click", onDown);

		onCleanup(() => {
			window.removeEventListener("ctxm", ctx as unknown as EventListener);
			window.removeEventListener("close-ctxm", close);
			document.removeEventListener("click", onDown);
		});
	});

	return (
		<div ref={menuAreaRef} onClick={() => {}}>
			<Show when={contextMenuStore.menu.options.length > 0}>
				<div
					class="absolute z-99999999 flex flex-col rounded-lg overflow-hidden bg-[#ffffff10] text-white shadow-tb-border-shadow backdrop-blur-[10px] duration-200"
					classList={{
						"translate-y-0": menuOpen(),
						"opacity-0 -translate-y-6": !menuOpen(),
					}}
					ref={menuRef}
					style={{ "backdrop-filter": "brightness(0.8) blur(10px)", top: `${contextMenuStore.menu.y}px`, left: `${contextMenuStore.menu.x}px` }}
				>
					<Show when={contextMenuStore.menu.titlebar}>
						{(() => {
							const titlebar = contextMenuStore.menu.titlebar;
							return typeof titlebar === "string" ? <div class="flex items-center px-3 py-2.5 bg-[#ffffff3c] w-full text-left select-none">{titlebar}</div> : titlebar;
						})()}
					</Show>
					<div class="duration-700" classList={{ "": menuOpen(), "-translate-y-2 opacity-0": !menuOpen() }}>
						<For each={contextMenuStore.menu.options}>
							{option => (
								<button
									type="button"
									class="flex text-lg font-bold leading-none px-3 py-2.5 hover:bg-[#ffffff3c] w-full text-left select-none duration-150 cursor-pointer"
									style={{ color: option.color }}
									onClick={() => {
										option.click();
										contextMenuStore.clearContextMenu();
										setMenuOpen(false);
									}}
								>
									{option.text}
								</button>
							)}
						</For>
					</div>
				</div>
			</Show>
		</div>
	);
};

export default ContextMenuArea;
