import { Icon } from "solid-heroicons";
import { arrowPath, lockClosed, moon, power } from "solid-heroicons/solid";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";

export default function Power() {
	const [showMenu, setShowMenu] = createSignal(false);
	const [showHardRestart, setShowHardRestart] = createSignal(false);
	let menu: HTMLDivElement | undefined;
	let iconRef: SVGSVGElement | undefined;

	createEffect(() => {
		const leave = (e: MouseEvent) => {
			if (showMenu() && e.target instanceof HTMLElement && e.target !== menu && !menu?.contains(e.target)) {
				setShowMenu(false);
				setShowHardRestart(false);
			}
		};
		document.addEventListener("mousedown", leave);
		onCleanup(() => document.removeEventListener("mousedown", leave));
	});

	createEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				setShowHardRestart(true);
			}
		};
		const up = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				setShowHardRestart(false);
			}
		};
		document.addEventListener("keydown", down);
		document.addEventListener("keyup", up);
		onCleanup(() => {
			document.removeEventListener("keydown", down);
			document.removeEventListener("keyup", up);
		});
	});

	return (
		<>
			<Icon
				path={power}
				ref={iconRef}
				class="size-6 stroke-[1.3px] stroke-current cursor-pointer duration-150"
				onMouseUp={() => {
					iconRef?.classList.remove("scale-90");
					setShowMenu(prev => !prev);
				}}
				onMouseLeave={() => iconRef?.classList.remove("scale-90")}
				onMouseOver={() => iconRef?.classList.add("scale-90")}
				onClick={() => iconRef?.classList.add("scale-90")}
			/>
			<div
				ref={menu}
				class="absolute top-[calc(48px+6px)] right-1.5 z-[-1] bg-[#2020208c] bg-[url(/assets/img/grain.png)] shadow-tb-border-shadow rounded-lg backdrop-blur-[8px] overflow-hidden"
				classList={{
					"duration-150": showMenu(),
					"opacity-0 -translate-y-6 pointer-events-none duration-200": !showMenu(),
				}}
			>
				<div
					class="flex flex-col duration-1000"
					classList={{
						"": showMenu(),
						"opacity-0 -translate-y-2": !showMenu(),
					}}
				>
					<div class="first:rounded-t-lg last:rounded-b-lg hover:bg-[#ffffff28] flex gap-8 justify-between items-center px-3 py-1.5 duration-150">
						<span class="select-none font-semibold">Sleep</span>
						<Icon path={moon} class="size-5" />
					</div>
					<div
						class="first:rounded-t-lg last:rounded-b-lg hover:bg-[#ffffff28] flex gap-8 justify-between items-center px-3 py-1.5 duration-150"
						onClick={() => {
							sessionStorage.setItem("logged-in", "false");
							window.location.reload();
						}}
					>
						<span class="select-none font-semibold">Lock</span>
						<Icon path={lockClosed} class="size-5" />
					</div>
					<div
						class="first:rounded-t-lg last:rounded-b-lg hover:bg-[#ffffff28] flex gap-8 justify-between items-center px-3 py-1.5 duration-150"
						onClick={() => {
							sessionStorage.setItem("logged-in", "false");
							window.location.reload();
						}}
					>
						<span class="select-none font-semibold">Restart</span>
						<Icon path={arrowPath} class="size-5 stroke-[1.3px] stroke-current" />
					</div>
					<Show when={showHardRestart()}>
						<div
							class="first:rounded-t-lg last:rounded-b-lg hover:bg-[#ffffff28] flex gap-8 justify-between items-center px-3 py-1.5 duration-150"
							onClick={() => {
								sessionStorage.clear();
								window.location.reload();
							}}
						>
							<span class="select-none font-semibold">Hard Restart</span>
							<Icon path={arrowPath} class="size-5 stroke-[1.3px] stroke-current" />
						</div>
					</Show>
					<div
						class="first:rounded-t-lg last:rounded-b-lg hover:bg-[#ff6060ce] flex gap-8 justify-between items-center px-3 py-1.5 duration-150"
						onClick={() => {
							sessionStorage.setItem("logged-in", "false");
							window.location.href = "https://google.com";
						}}
					>
						<span class="select-none font-semibold">Shutdown</span>
						<Icon path={power} class="size-5 stroke-[1.3px] stroke-current" />
					</div>
				</div>
			</div>
		</>
	);
}
