import { createId } from "@paralleldrive/cuid2";
import { createSignal, For, onMount, Show } from "solid-js";
import "./styles/shell.css";

export interface AppIslandProps {
	text?: string;
	click?: () => void;
	appname?: string;
	id?: string;
}

type Control = {
	id: string;
	text?: string;
	click?: () => void;
};

type IslandState = {
	props: AppIslandProps | null;
	controls: Control[];
};

export let updateInfo: (props: AppIslandProps) => void;
export let updateControls: (props: AppIslandProps) => void;
export let clearInfo: () => void;
export let clearControls: (appname: string) => void;

export default function AppIsland() {
	const [islands, setIslands] = createSignal<{ [appname: string]: IslandState }>({});
	const [activeApp, setActiveApp] = createSignal<string | null>(null);

	const onUpdate = (props: AppIslandProps) => {
		if (!props.appname) return;
		const appname = props.appname;
		setIslands(prev => ({
			...prev,
			[appname]: {
				...(prev[appname] || { props: null, controls: [] }),
				props: { ...prev[appname]?.props, ...props },
			},
		}));
		setActiveApp(props.appname);
		window.dispatchEvent(new CustomEvent("selwin-upd", { detail: props.appname }));
	};

	const updconts = (props: AppIslandProps) => {
		if (!props.appname) return;
		const appname = props.appname;
		const controlId = props.id || createId();
		const whenClick = props.click ? props.click : () => {};
		setIslands(prev => {
			const appState = prev[appname] || { props: null, controls: [] };
			if (appState.controls.some(control => control.id === controlId)) {
				return prev;
			}
			const newControl: Control = {
				id: controlId,
				text: props.text,
				click: whenClick,
			};
			return {
				...prev,
				[appname]: {
					...appState,
					controls: [...appState.controls, newControl],
				},
			};
		});
		window.dispatchEvent(new CustomEvent("selwin-upd", { detail: appname }));
	};

	const clear = (appname: string) => {
		setIslands(prev => ({
			...prev,
			[appname]: {
				...(prev[appname] || { props: null, controls: [] }),
				controls: [],
			},
		}));
	};

	const clearinf = () => {
		setActiveApp(null);
	};

	onMount(() => {
		updateInfo = onUpdate;
		updateControls = updconts;
		clearInfo = clearinf;
		clearControls = clear;
	});

	return (
		<div class="island-container">
			<div class="island relative app_island text flex gap-[8px] items-center rounded-lg h-min" classList={{ "opacity-100": !!activeApp(), "opacity-0": !activeApp() }}>
				<For each={Object.entries(islands())}>
					{([appname, island]) => (
						<div
							class="flex gap-3 duration-150"
							classList={{
								"opacity-100 z-[1]": activeApp() === appname,
								"opacity-0 absolute pointer-events-none": activeApp() !== appname,
							}}
							id={island.props?.id}
							data-app-name={appname}
						>
							<div class="font-bold text-white text-2xl cursor-[var(--cursor-text)]">{appname}</div>
							<Show when={island.controls.length > 0}>
								<div class="font-medium text-[#ffffff88] text-sm flex gap-2">
									<For each={island.controls}>
										{control => (
											<button type="button" class="cursor-pointer hover:text-[#ffffffe3] duration-150" attr:control-id={control.id} onClick={control.click || (() => {})}>
												{control.text}
											</button>
										)}
									</For>
								</div>
							</Show>
						</div>
					)}
				</For>
			</div>
		</div>
	);
}
