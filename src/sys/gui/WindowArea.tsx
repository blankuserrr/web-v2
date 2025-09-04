import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";
import { useWindowStore, addWindow as storeAddWindow, windowStore as globalWindowStore } from "../Store";
import { fileExists, type UserSettings, type WindowConfig } from "../types";
import { clearInfo, updateInfo } from "./AppIsland";

interface WindowProps {
	config: WindowConfig;
	className?: string;
	children?: any;
	onSnapPreview?: (pos: string) => void;
	onSnapDone?: () => void;
}

interface DesktopItem {
	name: string;
	icon: string;
	position: {
		custom: boolean;
		left: number | string;
		top: number | string;
	};
	item: string;
	type: string;
	config: WindowConfig;
}

const WindowElement = (props: WindowProps) => {
	const windowStore = useWindowStore();

	let windowRef: HTMLDivElement | undefined;
	let regionRef: HTMLDivElement | undefined;
	let focuserRef: HTMLDivElement | undefined;
	let srcRef: HTMLIFrameElement | undefined;
	let miniRef: SVGSVGElement | undefined;
	let minMaxRef: SVGSVGElement | undefined;
	let closeRef: SVGSVGElement | undefined;

	let topResizer: HTMLDivElement | undefined;
	let leftResizer: HTMLDivElement | undefined;
	let rightResizer: HTMLDivElement | undefined;
	let bottomResizer: HTMLDivElement | undefined;

	let contentRef: HTMLDivElement | undefined;
	let titleRef: HTMLSpanElement | undefined;
	let thtmlref: HTMLDivElement | undefined;

	const wid = props.config.wid;
	const pid = props.config.pid;
	const [zIndex, setZIndex] = createSignal(props.config.zIndex);
	const [isMouseDown, setIsMouseDown] = createSignal(false);
	const [isDragging, setIsDragging] = createSignal(false);
	const [x, setX] = createSignal<number | string>("center");
	const [y, setY] = createSignal<number | string>("center");
	const [width, setWidth] = createSignal(props.config.size?.width || 400);
	const [height, setHeight] = createSignal(props.config.size?.height || 400);
	const titlebarhtml = typeof props.config.title === "object" ? props.config.title?.html : undefined;
	const [maximized, setMaximized] = createSignal(false);
	const [minimized, setMinimized] = createSignal(false);
	const title = typeof props.config.title === "string" ? props.config.title : props.config.title?.text;
	const [_message, setMessage] = createSignal(props.config.message);
	const [snapRegion, setSnapRegion] = createSignal<string | null>(null);
	const [isResizing, setIsResizing] = createSignal<boolean>(false);
	const [controls, setControls] = createSignal(props.config.controls);
	const [src, setSrc] = createSignal(props.config.src);

	const mobileCheck = async () => {
		if ((await window.tb.platform.getPlatform()) === "mobile") {
			setMaximized(true);
			setControls(["minimize", "close"]);
		}
	};
	mobileCheck();

	createEffect(() => {
		updateInfo({ appname: typeof props.config.title === "string" ? props.config.title : props.config.title?.text });
	});

	createEffect(() => {
		if (windowRef) {
			if (x() === "center") {
				setX(window.innerWidth / 2 - windowRef.offsetWidth / 2);
			}
			if (y() === "center") {
				setY(window.innerHeight / 2 - windowRef.offsetHeight / 2);
			}
			windowRef.classList.remove("opacity-0", "translate-y-3");
			setTimeout(() => {
				windowRef?.classList.remove("duration-150");
			}, 150);
		}
		if (thtmlref && titlebarhtml) {
			thtmlref.innerHTML = titlebarhtml;
		}
		const prox = async () => {
			if (props.config.proxy === true) {
				const settings: UserSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${sessionStorage.getItem("currAcc")}/settings.json`, "utf8"));
				console.log(settings.proxy);
				if (settings.proxy === "Ultraviolet") {
					setSrc(`${window.location.origin}/uv/service/${await window.tb.proxy.encode(props.config.src, "XOR")}`);
				} else {
					setSrc(`${window.location.origin}/service/${await window.tb.proxy.encode(props.config.src, "XOR")}`);
				}
			}
		};
		prox();
		if (srcRef?.contentWindow) {
			try {
				Object.assign(srcRef.contentWindow as typeof window, {
					tb: window.parent.tb,
					anura: window.parent.anura,
					AliceWM: window.parent.AliceWM,
					LocalFS: window.parent.LocalFS,
					ExternalApp: window.parent.ExternalApp,
					ExternalLib: window.parent.ExternalLib,
					Filer: window.parent.Filer,
				});
			} catch (err) {
				// Cross-origin iframe; skip injecting globals
			}
		}
	});

	onMount(() => {
		const reload = (e: CustomEvent) => {
			if (e.detail === props.config.pid) {
				if (srcRef?.contentWindow) {
					srcRef.contentWindow.location.reload();
					Object.assign(srcRef.contentWindow, {
						tb: window.parent.tb,
						anura: window.parent.anura,
						AliceWM: window.parent.AliceWM,
						LocalFS: window.parent.LocalFS,
						ExternalApp: window.parent.ExternalApp,
						ExternalLib: window.parent.ExternalLib,
						Filer: window.parent.Filer,
					});
				}
			}
		};
		const max = (e: CustomEvent) => {
			if (e.detail === props.config.pid) {
				setMaximized(true);
				if (wid) windowStore.arrange(wid);
			}
		};
		const min = (e: CustomEvent) => {
			if (e.detail === props.config.pid) {
				setMinimized(true);
			}
		};
		const returnCont = (e: CustomEvent) => {
			if (e.detail === props.config.pid) {
				window.dispatchEvent(new CustomEvent("curr-win-content", { detail: contentRef }));
			}
		};
		const setCont = (e: CustomEvent) => {
			const msg = JSON.parse(e.detail);
			if (msg.currWin === props.config.pid) {
				if (contentRef) {
					contentRef.innerHTML = msg.content;
				}
			}
		};
		const setBC = (e: CustomEvent) => {
			const msg = JSON.parse(e.detail);
			if (msg.currWin === props.config.pid) {
				if (titleRef) {
					titleRef.style.color = msg.color;
				}
			}
		};
		const setBG = (e: CustomEvent) => {
			const msg = JSON.parse(e.detail);
			if (msg.currWin === props.config.pid) {
				if (titleRef) {
					titleRef.style.backgroundColor = msg.color;
				}
			}
		};
		const settxt = (e: CustomEvent) => {
			const msg = JSON.parse(e.detail);
			if (msg.currWin === props.config.pid) {
				if (titleRef) {
					titleRef.innerText = msg.txt;
				}
			}
		};
		const selWin = (e: CustomEvent) => {
			if (e.detail === props.config.wid) {
				windowStore.arrange(wid);
				const windowData = windowStore.getWindow(wid);
				if (windowData) setZIndex(windowData.zIndex);
				setMinimized(false);
				setTimeout(() => {
					windowRef?.classList.remove("duration-150");
				}, 150);
				if (focuserRef) focuserRef.click();
				updateInfo({ appname: typeof props.config.title === "string" ? props.config.title : props.config.title?.text });
			}
		};
		const debugCTX = (e: MouseEvent) => {
			const rect = (e.target as HTMLElement).getBoundingClientRect();
			window.tb.contextmenu.create({
				x: rect.left + 100,
				y: rect.top + 40,
				options: [
					{
						text: "Minimize",
						click: () => {
							setMinimized(true);
						},
					},
					{
						text: "Maximize",
						click: () => {
							setMaximized(true);
						},
					},
					{
						text: "Reload",
						click: () => {
							if (srcRef?.contentWindow) {
								srcRef.contentWindow.location.reload();
								Object.assign(srcRef.contentWindow as any, {
									tb: window.parent.tb,
									anura: window.parent.anura,
									AliceWM: window.parent.AliceWM,
									LocalFS: window.parent.LocalFS,
									ExternalApp: window.parent.ExternalApp,
									ExternalLib: window.parent.ExternalLib,
									Filer: window.parent.Filer,
								});
							}
						},
					},
					{
						text: "Close",
						click: () => {
							windowStore.removeWindow(wid);
							clearInfo();
						},
					},
				],
			});
		};
		const changeURL = (e: CustomEvent) => {
			const det = JSON.parse(e.detail);
			if (det.pid === props.config.pid) {
				if (srcRef?.contentWindow) {
					setSrc(det.url);
					Object.assign(srcRef.contentWindow, {
						tb: window.parent.tb,
						anura: window.parent.anura,
						AliceWM: window.parent.AliceWM,
						LocalFS: window.parent.LocalFS,
						ExternalApp: window.parent.ExternalApp,
						ExternalLib: window.parent.ExternalLib,
						Filer: window.parent.Filer,
					});
				}
			}
		};
		const minall: any = () => {
			if (!minimized()) setMinimized(true);
		};

		window.addEventListener("reload-win", reload as EventListener);
		window.addEventListener("max-win", max as EventListener);
		window.addEventListener("min-win", min as EventListener);
		window.addEventListener("get-content", returnCont as EventListener);
		window.addEventListener("upd-wincont", setCont as EventListener);
		window.addEventListener("upd-winbarcol", setBC as EventListener);
		window.addEventListener("upd-winbartxt", settxt as EventListener);
		window.addEventListener("upd-winbarbg", setBG as EventListener);
		window.addEventListener("upd-src", changeURL as EventListener);
		window.addEventListener("sel-win", selWin as EventListener);
		window.addEventListener("min-wins", minall);
		if (regionRef) regionRef.addEventListener("contextmenu", debugCTX);

		onCleanup(() => {
			window.removeEventListener("reload-win", reload as EventListener);
			window.removeEventListener("max-win", max as EventListener);
			window.removeEventListener("min-win", min as EventListener);
			window.removeEventListener("get-content", returnCont as EventListener);
			window.removeEventListener("upd-wincont", setCont as EventListener);
			window.removeEventListener("upd-winbarcol", setBC as EventListener);
			window.removeEventListener("upd-winbartxt", settxt as EventListener);
			window.removeEventListener("upd-winbarbg", setBG as EventListener);
			window.removeEventListener("upd-src", changeURL as EventListener);
			window.removeEventListener("sel-win", selWin as EventListener);
			window.removeEventListener("min-wins", minall);
			if (regionRef) regionRef.removeEventListener("contextmenu", debugCTX);
		});
	});

	const handleSnap = (newX: number, newY: number) => {
		if (props.config.snapable !== false) {
			if (!windowRef) return;
			const windowWidth = windowRef.offsetWidth;
			const SNAP_THRESHOLD = 7;
			if (newX <= SNAP_THRESHOLD) {
				setX(0);
				setSnapRegion("left");
				props.onSnapPreview?.("left");
			} else if (newX + windowWidth >= window.innerWidth - SNAP_THRESHOLD) {
				setX(window.innerWidth - windowWidth);
				setSnapRegion("right");
				props.onSnapPreview?.("right");
			} else if (newY <= SNAP_THRESHOLD) {
				setY(0);
				setSnapRegion("top");
				props.onSnapPreview?.("top");
			} else {
				setSnapRegion(null);
				props.onSnapDone?.();
			}
		}
	};

	createEffect(() => {
		const snap = () => {
			setIsMouseDown(false);
			setIsDragging(false);
			if (windowRef)
				if (snapRegion() === "left") {
					windowRef.style.left = "0";
					windowRef.style.width = "50%";
					windowRef.style.height = "100%";
					windowRef.style.top = "0";
				} else if (snapRegion() === "right") {
					windowRef.style.left = "50%";
					windowRef.style.width = "50%";
					windowRef.style.height = "100%";
					windowRef.style.top = "0";
				} else if (snapRegion() === "top") {
					if (maximized() === false && isDragging() === true) {
						setMaximized(true);
					}
				} else {
					if (isResizing() === false && isDragging()) {
						windowRef.style.left = `${x()}`;
						windowRef.style.width = `${width()}`;
						windowRef.style.height = `${height()}`;
						windowRef.style.top = `${y()}`;
					}
				}
			props.onSnapDone?.();
			if (srcRef) {
				srcRef.style.pointerEvents = "auto";
			}
		};
		window.addEventListener("mouseup", snap);
		onCleanup(() => window.removeEventListener("mouseup", snap));
	});

	const handleMouseDown = (direction: "top" | "left" | "right" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right") => {
		const onMove = (e: MouseEvent) => {
			setIsResizing(true);
			setMaximized(false);
			if (windowRef) windowRef.style.transform = "";

			if (direction.includes("top")) {
				const offsetY = e.clientY - 65;
				const newY = Math.max(offsetY, 0);
				const newHeight = height() + (typeof y() === "number" ? (y() as number) - newY : 0);
				if (newHeight >= (props.config.size?.minHeight ?? 224)) {
					setHeight(newHeight);
					setY(newY);
				}
			}
			if (direction.includes("left")) {
				const offsetX = e.clientX - 10;
				const newX = Math.max(offsetX, 0);
				const newWidth = width() + (typeof x() === "number" ? (x() as number) - newX : 0);
				if (newWidth >= (props.config.size?.minWidth ?? 224)) {
					setWidth(newWidth);
					setX(newX);
				}
			}
			if (direction.includes("right")) {
				const offsetX = e.clientX - 5;
				const newX = typeof x() === "number" ? (x() as number) : 0;
				const newWidth = offsetX - newX;
				if (newWidth >= (props.config.size?.minWidth ?? 224)) {
					setWidth(newWidth);
					setX(newX);
				}
			}
			if (direction.includes("bottom")) {
				const offsetY = e.clientY - 55;
				const newY = typeof y() === "number" ? (y() as number) : 0;
				const newHeight = offsetY - newY;
				if (newHeight >= (props.config.size?.minHeight ?? 224)) {
					setHeight(newHeight);
					setY(newY);
				}
			}
		};

		const onUp = () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
			setIsMouseDown(false);
			setIsResizing(false);
		};

		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
		setIsMouseDown(true);
	};

	onMount(() => {
		const listenForMessage = (e: any) => {
			setMessage(e.data);
			srcRef?.contentWindow?.postMessage(props.config.message, "*");
		};
		window.addEventListener("message", listenForMessage as EventListener);

		onCleanup(() => {
			window.removeEventListener("message", listenForMessage as EventListener);
		});
	});

	return (
		<div
			ref={windowRef}
			id={wid || ""}
			data-pid={pid}
			class={`
            ${props.className ? props.className : ""}
            absolute
            bg-[#ffffff18]
            rounded-lg shadow-window-shadow overflow-hidden
            ${minimized() ? "translate-y-3 opacity-0 duration-150 hidden" : " translate-y-0 opacity-100"}
            ${maximized() ? "left-0 right-0 top-0 bottom-0 opacity-100 w-full h-full" : `w-[${width()}px] h-[${height()}px]`}
        `}
			style={{
				left: maximized() ? "0" : typeof x() === "number" ? `${x()}px` : (x() as string),
				top: maximized() ? "0" : typeof y() === "number" ? `${y()}px` : (y() as string),
				height: maximized() ? "100%" : `${height()}px`,
				width: maximized() ? "100%" : `${width()}px`,
				"z-index": minimized() ? "2" : `${zIndex()}`,
			}}
			onMouseDown={() => {
				updateInfo({ appname: typeof props.config.title === "string" ? props.config.title : props.config.title?.text });
			}}
		>
			<div
				class="absolute left-0 top-0 size-full rounded-lg backdrop-blur-[20px] pointer-events-none shadow-tb-border -z-1 bg-[#00000048]"
				style={{
					"background-image": "url(/assets/img/grain.png)",
				}}
			/>
			<div
				ref={focuserRef}
				class={`absolute rounded-lg ${props.config.focused ? "inset-x-2 top-[calc(40px+0.5rem)] bottom-2 opacity-0" : "inset-x-[1px] top-[40px] bottom-[1px] backdrop-blur-[4px] opacity-100"} pointer-events-none -z-1 duration-150`}
				onMouseDown={() => {
					if (wid) {
						windowStore.arrange(wid);
						const windowData = windowStore.getWindow(wid);
						if (windowData) setZIndex(windowData.zIndex);
					}
				}}
			/>
			<div ref={topResizer} class="absolute left-0 right-0 h-[6px] cursor-n-resize" data-resizer="top" onMouseDown={() => handleMouseDown("top")} />
			<div ref={leftResizer} class="absolute left-0 top-[6px] bottom-[6px] w-[6px] cursor-w-resize" data-resizer="left" onMouseDown={() => handleMouseDown("left")} />
			<div ref={rightResizer} class="absolute right-0 top-[6px] bottom-[6px] w-[6px] cursor-e-resize" data-resizer="right" onMouseDown={() => handleMouseDown("right")} />
			<div ref={bottomResizer} class="absolute bottom-0 left-0 right-0 h-[6px] cursor-s-resize" data-resizer="bottom" onMouseDown={() => handleMouseDown("bottom")} />
			<div class="absolute top-0 left-0 size-2.5 cursor-nw-resize" onMouseDown={() => handleMouseDown("top-left")} />
			<div class="absolute top-0 right-0 size-2.5 cursor-ne-resize" onMouseDown={() => handleMouseDown("top-right")} />
			<div class="absolute bottom-0 left-0 size-2.5 cursor-sw-resize" onMouseDown={() => handleMouseDown("bottom-left")} />
			<div class="absolute bottom-0 right-0 size-2.5 cursor-se-resize" onMouseDown={() => handleMouseDown("bottom-right")} />
			<div
				ref={regionRef}
				class="region z-10 flex justify-between items-center bg-[#ffffff10] p-2 min-w-[224px] select-none"
				onMouseDown={(e: MouseEvent) => {
					windowStore.arrange(wid);
					const windowData = windowStore.getWindow(wid);
					if (windowData) setZIndex(windowData.zIndex);
					if ((e.target as HTMLElement).classList.contains("no-drag")) return;
					const offsetX = e.clientX - (windowRef?.offsetLeft || 0);
					const offsetY = e.clientY - (windowRef?.offsetTop || 0);

					const onMove = (e: MouseEvent) => {
						if (windowRef) windowRef.style.transform = "";
						setIsDragging(true);
						setMaximized(false);
						const newX = e.clientX - offsetX;
						const newY = e.clientY - offsetY;
						handleSnap(newX, newY);
						if (newY > 0 && newY < window.innerHeight - (windowRef?.offsetHeight || 0)) setY(newY);
						if (newX > 0 && newX < window.innerWidth - (windowRef?.offsetWidth || 0)) setX(newX);
						if (srcRef) srcRef.style.pointerEvents = "none";
					};

					window.addEventListener("mousemove", onMove);

					window.onmouseup = () => {
						window.removeEventListener("mousemove", onMove);
					};

					window.onmouseleave = () => {
						setIsDragging(false);
					};

					setIsMouseDown(true);
				}}
				onMouseUp={() => {
					setIsMouseDown(false);
					setIsDragging(false);
				}}
				onMouseLeave={() => {
					if (isMouseDown()) {
						setIsDragging(false);
					}
				}}
				onMouseEnter={() => {
					if (isMouseDown()) {
						setIsDragging(true);
					}
				}}
				onDblClick={() => {
					if (props.config.maximizable !== false)
						if (windowRef) {
							windowRef.style.transitionProperty = "width, height, left, top";
							windowRef.style.transitionDuration = "150ms";
						}
					setTimeout(() => {
						if (windowRef) {
							windowRef.style.transitionProperty = "";
							windowRef.style.transitionDuration = "";
						}
					}, 150);
					setMaximized(!maximized());
				}}
			>
				<div class="flex gap-2 items-center">
					<img src={props.config.icon} alt="icon" class="w-5 h-5 pointer-events-none" draggable={false} />
					<span ref={titleRef} class="font-[680] pointer-events-none">
						{title}
					</span>
					{titlebarhtml && <div ref={thtmlref} />}
				</div>
				{controls() ? (
					<div class="controls flex gap-1">
						<For each={controls()}>
							{(control, _index) => {
								if (control === "minimize") {
									return (
										<svg
											ref={miniRef}
											class={`group size-4 ${props.config.minimizable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
											viewBox="0 0 24 24"
											fill="none"
											onMouseDown={() => {
												if (props.config.minimizable === false) return;
												if (windowRef) {
													windowRef.style.transitionProperty = "transform, opacity";
													windowRef.style.transitionDuration = "150ms";
												}
												setTimeout(() => {
													if (windowRef) {
														windowRef.style.transitionProperty = "";
														windowRef.style.transitionDuration = "";
													}
												}, 150);
												setMinimized(true);
											}}
										>
											<rect
												class={`
                                                    ${props.config.minimizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                                `}
												x="4"
												y="10"
												width="16"
												height="3"
												rx="2"
											/>
										</svg>
									);
								}
								if (control === "maximize") {
									return (
										<svg
											ref={minMaxRef}
											class={`group size-4 ${props.config.maximizable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
											viewBox="0 0 24 24"
											fill="none"
											onMouseDown={() => {
												if (props.config.maximizable === false) return;
												if (windowRef) {
													windowRef.style.transitionProperty = "width, height, left, top";
													windowRef.style.transitionDuration = "150ms";
												}
												setTimeout(() => {
													if (windowRef) {
														windowRef.style.transitionProperty = "";
														windowRef.style.transitionDuration = "";
													}
												}, 150);
												setMaximized(!maximized());
											}}
										>
											{maximized() ? (
												<>
													<path
														class={`
                                                                    ${props.config.maximizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                                                `}
														d="M6 6C6 3.79086 7.79086 2 10 2H18C20.2091 2 22 3.79086 22 6V14C22 16.2091 20.2091 18 18 18H16V16H18C19.1046 16 20 15.1046 20 14V6C20 4.89543 19.1046 4 18 4H10C8.89543 4 8 4.89543 8 6V8H6V6Z"
													/>
													<path
														class="fill-[#ffffffbb] group-hover:fill-white duration-150 pointer-events-none"
														fill-rule="evenodd"
														clip-rule="evenodd"
														d="M6 6C3.79086 6 2 7.79086 2 10V18C2 20.2091 3.79086 22 6 22H14C16.2091 22 18 20.2091 18 18V10C18 7.79086 16.2091 6 14 6H6ZM6 8C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H14C15.1046 20 16 19.1046 16 18V10C16 8.89543 15.1046 8 14 8H6Z"
													/>
												</>
											) : (
												<path
													class={`
                                                                ${props.config.maximizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                                            `}
													fill-rule="evenodd"
													clip-rule="evenodd"
													d="M8 4C5.79086 4 4 5.79086 4 8V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V8C20 5.79086 18.2091 4 16 4H8ZM8 6C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8Z"
												/>
											)}
										</svg>
									);
								}
								if (control === "close") {
									return (
										<svg
											ref={closeRef}
											class={`group size-4 ${props.config.closable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
											viewBox="0 0 24 24"
											fill="none"
											onMouseDown={() => {
												if (props.config.closable === false) return;
												if (windowRef) {
													windowRef.style.transitionProperty = "transform, opacity";
													windowRef.style.transitionDuration = "150ms";
													windowRef.classList.add("opacity-0");
												}
												setTimeout(() => {
													clearInfo();
													windowStore.removeWindow(wid);
												}, 150);
											}}
										>
											<path
												class={`
                                                    ${props.config.closable === false ? "stroke-[#ffffff60]" : "stroke-[#ffffffbb] group-hover:stroke-white"} duration-150 pointer-events-none
                                                `}
												d="M6 18L18 6M6 6L18 18"
												stroke="white"
												stroke-width="2.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									);
								}
							}}
						</For>
					</div>
				) : (
					<div class="controls flex gap-1">
						<svg
							ref={miniRef}
							class={`group size-4 ${props.config.minimizable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
							viewBox="0 0 24 24"
							fill="none"
							onMouseDown={() => {
								if (props.config.minimizable === false) return;
								if (windowRef) {
									windowRef.style.transitionProperty = "transform, opacity";
									windowRef.style.transitionDuration = "150ms";
								}
								setTimeout(() => {
									if (windowRef) {
										windowRef.style.transitionProperty = "";
										windowRef.style.transitionDuration = "";
									}
								}, 150);
								windowStore.minimize(wid);
								window.dispatchEvent(new CustomEvent("min-win", { detail: pid }));
								setMinimized(true);
							}}
						>
							<rect
								class={`
                                    ${props.config.minimizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                `}
								x="4"
								y="10"
								width="16"
								height="3"
								rx="2"
							/>
						</svg>
						<svg
							ref={minMaxRef}
							class={`group size-4 ${props.config.maximizable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
							viewBox="0 0 24 24"
							fill="none"
							onMouseDown={() => {
								if (props.config.maximizable === false) return;
								if (windowRef) {
									windowRef.style.transitionProperty = "width, height, left, top";
									windowRef.style.transitionDuration = "150ms";
								}
								setTimeout(() => {
									if (windowRef) {
										windowRef.style.transitionProperty = "";
										windowRef.style.transitionDuration = "";
									}
								}, 150);
								setMaximized(!maximized());
							}}
						>
							{maximized() ? (
								<>
									<path
										class={`
                                                ${props.config.maximizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                            `}
										d="M6 6C6 3.79086 7.79086 2 10 2H18C20.2091 2 22 3.79086 22 6V14C22 16.2091 20.2091 18 18 18H16V16H18C19.1046 16 20 15.1046 20 14V6C20 4.89543 19.1046 4 18 4H10C8.89543 4 8 4.89543 8 6V8H6V6Z"
									/>
									<path
										class="fill-[#ffffffbb] group-hover:fill-white duration-150 pointer-events-none"
										fill-rule="evenodd"
										clip-rule="evenodd"
										d="M6 6C3.79086 6 2 7.79086 2 10V18C2 20.2091 3.79086 22 6 22H14C16.2091 22 18 20.2091 18 18V10C18 7.79086 16.2091 6 14 6H6ZM6 8C4.89543 8 4 8.89543 4 10V18C4 19.1046 4.89543 20 6 20H14C15.1046 20 16 19.1046 16 18V10C16 8.89543 15.1046 8 14 8H6Z"
									/>
								</>
							) : (
								<path
									class={`
                                            ${props.config.maximizable === false ? "fill-[#ffffff60]" : "fill-[#ffffffbb] group-hover:fill-white"} duration-150 pointer-events-none
                                        `}
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M8 4C5.79086 4 4 5.79086 4 8V16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16V8C20 5.79086 18.2091 4 16 4H8ZM8 6C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8Z"
								/>
							)}
						</svg>
						<svg
							ref={closeRef}
							class={`group size-4 ${props.config.closable === false ? "cursor-default" : "cursor-pointer"} no-drag`}
							viewBox="0 0 24 24"
							fill="none"
							onMouseDown={() => {
								if (props.config.closable === false) return;
								if (windowRef) {
									windowRef.style.transitionProperty = "transform, opacity";
									windowRef.style.transitionDuration = "150ms";
									windowRef.classList.add("translate-y-3", "opacity-0");
								}
								setTimeout(() => {
									clearInfo();
									windowStore.removeWindow(wid);
								}, 150);
							}}
						>
							<path
								class={`
                                    ${props.config.closable === false ? "stroke-[#ffffff60]" : "stroke-[#ffffffbb] group-hover:stroke-white"} duration-150 pointer-events-none
                                `}
								d="M6 18L18 6M6 6L18 18"
								stroke="white"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				)}
			</div>
			<div ref={contentRef} class="w-full h-full">
				<iframe
					ref={srcRef}
					src={src()}
					sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-downloads"
					title="Application Window"
					onLoad={() => {
						if (props.config.message && srcRef?.contentWindow) {
							srcRef.contentWindow.postMessage(props.config.message, "*");
						}
						const sr1 = document.createElement("script");
						const sr2 = document.createElement("script");
						sr1.src = "/cursor_changer.js";
						sr2.src = "/media_interactions.js";
						if (srcRef?.contentDocument) {
							srcRef.contentDocument.head.appendChild(sr2);
							srcRef.contentDocument.head.appendChild(sr1);
						}
					}}
					referrerPolicy="no-referrer"
					style={{ border: "none", all: "initial", width: "100%", height: "calc(100% - 40px)", "pointer-events": isMouseDown() ? "none" : "auto", "user-select": "none" }}
				/>
			</div>
		</div>
	);
};

const DesktopItems = () => {
	const [items, setItems] = createSignal<any[]>([]);
	const [dragging, setDragging] = createSignal<boolean>(false);
	const [draggedItemIndex, setDraggedItemIndex] = createSignal<number | null>(null);
	const [offset, _setOffset] = createSignal<{ x: number; y: number }>({ x: 0, y: 0 });
	const [_dragradius, setDragradius] = createSignal<boolean>(false);
	const [_selected, setSelected] = createSignal<any>(null);
	let selectedRef: HTMLDivElement | undefined;
	const user = sessionStorage.getItem("currAcc");

	onMount(() => {
		const addDesktopListener = async () => {
			let desktopItems: string[] = await Filer.fs.promises.readdir(`/home/${user}/desktop`);

			const handleDesktopChange = async () => {
				try {
					const updatedItems = await Filer.fs.promises.readdir(`/home/${user}/desktop`);
					const addedItems = updatedItems.filter(item => !desktopItems.includes(item));
					const removedItems = desktopItems.filter(item => !updatedItems.includes(item));
					const desktopConfig = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
					if (addedItems.length > 0) {
						const findLastItem = () => {
							for (let i = desktopConfig.length - 1; i >= 0; i--) {
								if (!desktopConfig[i].position.custom) {
									return desktopConfig[i];
								}
							}
							return null;
						};

						const lastItem: any = findLastItem();
						const highestLeft = Math.max(...desktopConfig.map((item: any) => item.position.left));
						let topPos = 0;
						let leftPos = 0;

						if (lastItem && lastItem.position.top < 11) {
							topPos = Math.floor(lastItem.position.top + 1);
							leftPos = lastItem.position.left;
						} else {
							leftPos = Math.floor(highestLeft + 1);
						}

						for (const item of addedItems) {
							const itemExists = desktopConfig.some((config: any) => config.item === `/home/${user}/desktop/${item}`);
							if (!itemExists) {
								const type = (await Filer.fs.promises.lstat(`/home/${user}/desktop/${item}`)).type.toLowerCase();
								if (type === "symlink") {
									const isAppJson = (await Filer.fs.promises.readFile(await Filer.fs.promises.readlink(`/home/${user}/desktop/${item}`))).includes("config");
									desktopConfig.push({
										name: isAppJson ? JSON.parse(await Filer.fs.promises.readFile(await Filer.fs.promises.readlink(`/home/${user}/desktop/${item}`))).config.title : item,
										item: `/home/${user}/desktop/${item}`,
										position: {
											custom: false,
											top: topPos,
											left: leftPos,
										},
									});
								} else if (type === "file") {
									const ext = item.split(".").pop();
									const icons = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/file-icons.json"));
									const iconName = ext ? icons["ext-to-name"][ext] : "Unknown";
									const iconPath = iconName ? icons["name-to-path"][iconName] : "/system/etc/terbium/file-icons/Unknown.svg";
									const iconData = await Filer.fs.promises.readFile(iconPath, "utf8");

									desktopConfig.push({
										name: item,
										item: `/home/${user}/desktop/${item}`,
										position: {
											custom: false,
											top: topPos,
											left: leftPos,
										},
										icon: iconData,
									});
								}
							}
						}
					}

					if (removedItems.length > 0) {
						for (const item of removedItems) {
							const index = desktopConfig.findIndex((config: any) => config.item === `/home/${user}/desktop/${item}`);
							desktopConfig.splice(index, 1);
						}
					}

					desktopItems = updatedItems;
					await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
				} catch (error) {
					console.error("Error while reading directory:", error);
				}
				window.dispatchEvent(new Event("upd-desktop"));
			};

			handleDesktopChange();
		};

		addDesktopListener();
	});

	onMount(() => {
		const getItems = async () => {
			const allItems: any[] = [];
			const itemsDataRaw = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
			// Deduplicate by 'item' path to avoid duplicates from concurrent updates
			const seen = new Set<string>();
			const itemsData = itemsDataRaw.filter((entry: any) => {
				if (seen.has(entry.item)) return false;
				seen.add(entry.item);
				return true;
			});
			for (const item of itemsData) {
				const type = (await Filer.fs.promises.lstat(item.item)).type.toLowerCase();
				const position = item.position;
				if (type === "symlink") {
					allItems.push({
						name: item.name,
						type: "symlink",
						item: item.item,
						position: {
							custom: position.custom,
							top: position.top,
							left: position.left,
						},
						config: JSON.parse(await Filer.fs.promises.readFile(await Filer.fs.promises.readlink(item.item))).config,
					});
				} else if (type === "file") {
					const ext = item.name.split(".").pop();
					const icons = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/file-icons.json"));
					const iconName = ext ? icons["ext-to-name"][ext] : "Unknown";
					const iconPath = iconName ? icons["name-to-path"][iconName] : "/system/etc/terbium/file-icons/Unknown.svg";
					const iconData = await Filer.fs.promises.readFile(iconPath, "utf8");
					allItems.push({
						name: item.name,
						type: "file",
						item: item.item,
						position: {
							custom: position.custom,
							top: position.top,
							left: position.left,
						},
						icon: iconData,
					});
				} else if (type === "directory") {
					allItems.push({
						name: item.name,
						type: "directory",
						item: item.item,
						position: {
							custom: position.custom,
							top: position.top,
							left: position.left,
						},
						icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" /></svg>`,
					});
				}
			}

			// Sort deterministically by top then left so DOM order stays stable
			allItems.sort((a, b) => {
				const ta = Number(a.position?.top ?? 0);
				const tb = Number(b.position?.top ?? 0);
				if (ta !== tb) return ta - tb;
				const la = Number(a.position?.left ?? 0);
				const lb = Number(b.position?.left ?? 0);
				return la - lb;
			});
			setItems(allItems);
		};
		getItems();
		window.addEventListener("upd-desktop", getItems);
		onCleanup(() => window.removeEventListener("upd-desktop", getItems));
	});

	const onMouseDown = (e: MouseEvent, index: number) => {
		let holdTimeout: NodeJS.Timeout | null = null;
		const startDragging = () => {
			setDragradius(true);
			setDragging(true);
			setDraggedItemIndex(index);
			// mark the hold as consumed so mouseup can persist new position
			holdTimeout = null;
		};

		const saveName = async (_name: string) => {
			if (selectedRef) {
				const spanElement = selectedRef.querySelector("span");
				if (spanElement) {
					const newName = spanElement.innerText;
					const oldName = items()[index].name;
					const itemPath = items()[index].item;
					const newPath = itemPath.replace(oldName, newName);
					if (selectedRef?.dataset.type === "shortcut") {
						const desktopItems = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
						const itemIndex = desktopItems.findIndex((item: any) => item.item === itemPath);
						if (itemIndex !== -1) {
							desktopItems[itemIndex].name = newName;
							desktopItems[itemIndex].item = newPath;
							await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopItems, null, 4));
							window.dispatchEvent(new Event("upd-desktop"));
						}
					} else {
						await Filer.fs.promises.rename(itemPath, newPath);
						const desktopItems = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
						const itemIndex = desktopItems.findIndex((item: any) => item.item === itemPath);
						if (itemIndex !== -1) {
							desktopItems[itemIndex].name = newName;
							desktopItems[itemIndex].item = newPath;
							await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopItems, null, 4));
							window.dispatchEvent(new Event("upd-desktop"));
							selectedRef = undefined;
						}
					}
				}
			}
		};

		if (selectedRef && selectedRef === e.currentTarget) {
			if (selectedRef && selectedRef !== null) {
				const spanElement = selectedRef.querySelector("span");
				if (spanElement) {
					spanElement.contentEditable = "true";
					const range = document.createRange();
					const selection = window.getSelection();
					range.selectNodeContents(spanElement);
					range.collapse(false);
					selection?.removeAllRanges();
					selection?.addRange(range);
					spanElement.addEventListener("keydown", async e => {
						if (e.key === "Enter") {
							e.preventDefault();
							saveName(spanElement.innerText);
						}
					});
					spanElement.focus();
				}
				document.addEventListener("mousedown", e => {
					if (selectedRef && !selectedRef.contains(e.target as Node)) {
						setSelected(null);
						const spanElement = selectedRef.querySelector("span");
						if (spanElement) {
							saveName(spanElement.innerText);
							spanElement.contentEditable = "false";
							spanElement.blur();
							selectedRef = undefined;
						}
					}
				});
			}
		} else {
			selectedRef = e.currentTarget as HTMLDivElement;
		}

		holdTimeout = setTimeout(startDragging, 300);
		const clearHoldTimeout = () => {
			if (holdTimeout) {
				clearTimeout(holdTimeout);
				holdTimeout = null;
			}
		};
		window.onmouseup = async (_e: MouseEvent) => {
			setDragging(false);
			window.removeEventListener("mousemove", onMouseMove);
			if (draggedItemIndex() !== null) {
				// Persist the final position exactly as rendered during drag
				const draggedApp = items()[draggedItemIndex()!];
				await savePos(draggedApp.item, draggedApp.position.left, draggedApp.position.top);
			}
			setDraggedItemIndex(null);
			clearHoldTimeout();
			setDragradius(false);
		};

		window.onmouseleave = async () => {
			clearHoldTimeout();
			setDragging(false);
			window.removeEventListener("mousemove", onMouseMove);
			if (draggedItemIndex() !== null && dragging()) {
				const draggedApp = items()[draggedItemIndex()!];
				const updatedApp = {
					...draggedApp,
					leftPos: draggedApp.position.left,
					topPos: draggedApp.position.top,
				};
				await savePos(draggedApp.item, updatedApp.leftPos, updatedApp.topPos);
			}
			setDraggedItemIndex(null);
		};

		e.preventDefault();
		(e.target as HTMLElement).addEventListener("mouseup", clearHoldTimeout, { once: true });
	};

	const onMouseMove = (e: MouseEvent) => {
		if (dragging() && draggedItemIndex() !== null) {
			const newX = e.clientX - offset().x - 44;
			const newY = e.clientY - offset().y - 80;

			setItems(prevApps => prevApps.map((app, index) => (index === draggedItemIndex() ? { ...app, position: { ...app.position, left: newX, top: newY, custom: true } } : app)));
		}
	};

	const savePos = async (item: string, left: number, top: number) => {
		try {
			const desktopConfig = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
			const itemIndex = desktopConfig.findIndex((config: any) => config.item === item);
			if (itemIndex !== -1) {
				// Save the exact final drag coordinates (rounded to integer pixels)
				desktopConfig[itemIndex].position.left = Math.round(left);
				desktopConfig[itemIndex].position.top = Math.round(top);
				desktopConfig[itemIndex].position.custom = true;
				await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
				window.dispatchEvent(new Event("upd-desktop"));
			}
		} catch (error) {
			console.error("Error saving app position:", error);
		}
	};

	createEffect(() => {
		document.addEventListener("mousemove", onMouseMove);
		onCleanup(() => {
			document.removeEventListener("mousemove", onMouseMove);
		});
	});

	return (
		<div class="flex gap-1 flex-wrap h-full">
			<For each={items()}>
				{(item: DesktopItem, i) => {
					return item.type === "file" ? (
						<div
							title={item.name}
							id="desktop-item"
							class="group relative size-max min-w-16 min-h-16 flex flex-col items-center justify-center p-2 text-sm font-medium text-wrap select-none"
							onDblClick={async () => {
								let handlers = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8")).fileAssociatedApps;
								handlers = Object.entries(handlers).filter(([type, app]) => {
									return !(type === "text" && app === "text-editor") && !(type === "image" && app === "media-viewer") && !(type === "video" && app === "media-viewer") && !(type === "audio" && app === "media-viewer");
								});
								const hands = [];
								for (const [type, app] of handlers) {
									hands.push({ text: app, value: type });
								}
								await window.tb.dialog.Select({
									title: `Select a application to open: ${item.item.split("/").pop()}`,
									options: [
										{
											text: "Text Editor",
											value: "text",
										},
										{
											text: "Media Viewer",
											value: "media",
										},
										{
											text: "Webview",
											value: "webview",
										},
										...hands,
										{
											text: "Other",
											value: "other",
										},
									],
									onOk: async (val: any) => {
										const data = await fetch("/fs//system/etc/terbium/file-icons.json").then(res => res.json());
										const ext = item.name.split(".").pop();
										switch (val) {
											case "text":
												parent.window.tb.file.handler.openFile(item.item, "text");
												break;
											case "media":
												if (data.image.includes(ext)) {
													parent.window.tb.file.handler.openFile(item.item, "image");
												} else if (data.video.includes(ext)) {
													parent.window.tb.file.handler.openFile(item.item, "video");
												} else if (data.audio.includes(ext)) {
													parent.window.tb.file.handler.openFile(item.item, "audio");
												}
												break;
											case "webview":
												parent.window.tb.file.handler.openFile(item.item, "webpage");
												break;
											case "other":
												window.tb.dialog.DirectoryBrowser({
													title: "Select a application",
													filter: ".tapp",
													onOk: async (val: any) => {
														const app = JSON.parse(await Filer.fs.promises.readFile(`${val}/.tbconfig`, "utf8"));
														createWindow({ ...app, message: { type: "process", path: item.item } });
													},
												});
												break;
											default:
												if (hands.length === 0) {
													parent.window.tb.file.handler.openFile(item.item, "text");
												} else {
													parent.window.tb.file.handler.openFile(item.item, val);
												}
												break;
										}
									},
								});
							}}
							onMouseDown={(e: MouseEvent) => onMouseDown(e, i())}
							onContextMenu={(e: MouseEvent) => {
								setDragging(false);
								setDraggedItemIndex(null);
								setDragradius(false);
								e.preventDefault();
								const { clientX, clientY } = e;
								window.tb.contextmenu.create({
									x: clientX,
									y: clientY,
									options: [
										{
											text: "Open",
											click: () => {
												sessionStorage.setItem("ldir", item.item);
												createWindow({
													title: "Files",
													icon: "/fs/apps/system/files.tapp/icon.svg",
													src: "/fs/apps/system/files.tapp/index.html",
													size: {
														width: 600,
														height: 500,
													},
												});
											},
										},
										{
											text: "Delete Shortcut",
											click: async () => {
												let idx = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
												idx = idx.filter((entry: any) => entry.name !== item.name);
												await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(idx, null, 4));
												window.dispatchEvent(new Event("upd-desktop"));
											},
										},
									],
								});
							}}
							style={{
								position: "absolute",
								left: `${item.position.custom === true ? item.position.left : Math.floor(Number(item.position.left) * 80)}px`,
								top: `${item.position.custom === true ? item.position.top : Math.floor(Number(item.position.top) * 66)}px`,
							}}
						>
							<div class="absolute z-1 size-full rounded-md bg-[#ffffff10] backdrop-blur-xl opacity-0 shadow-tb-border-shadow group-hover:opacity-100 focus:opacity-100 duration-150 ease-in pointer-events-none select-none" />
							<div class="flex z-2 size-full flex-col items-center justify-center pointer-events-none">
								<div class="size-6 pointer-events-none select-none" innerHTML={item.icon} />
								<span class="leading-none bg-transparent text-white text-center select-none w-16" style={{ "text-shadow": "0 0 4px #00000052" }}>
									{item.name.length > 12 ? `${item.name.slice(0, 10)}...` : item.name}
								</span>
							</div>
						</div>
					) : item.type === "directory" ? (
						<div
							title={item.name}
							id="desktop-item"
							class="group relative size-max min-w-16 min-h-16 flex flex-col items-center justify-center p-2 text-sm font-medium text-wrap select-none"
							onDblClick={() => {
								sessionStorage.setItem("ldir", item.item);
								createWindow({
									title: "Files",
									icon: "/fs/apps/system/files.tapp/icon.svg",
									src: "/fs/apps/system/files.tapp/index.html",
									size: {
										width: 600,
										height: 500,
									},
								});
							}}
							onMouseDown={(e: MouseEvent) => onMouseDown(e, i())}
							onContextMenu={(e: MouseEvent) => {
								setDragging(false);
								setDraggedItemIndex(null);
								setDragradius(false);
								e.preventDefault();
								const { clientX, clientY } = e;
								window.tb.contextmenu.create({
									x: clientX,
									y: clientY,
									options: [
										{
											text: "Open",
											click: () => {
												sessionStorage.setItem("ldir", item.item);
												createWindow({
													title: "Files",
													icon: "/fs/apps/system/files.tapp/icon.svg",
													src: "/fs/apps/system/files.tapp/index.html",
													size: {
														width: 600,
														height: 500,
													},
												});
											},
										},
										{
											text: "Delete Shortcut",
											click: async () => {
												let idx = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
												idx = idx.filter((entry: any) => entry.name !== item.name);
												await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(idx, null, 4));
												window.dispatchEvent(new Event("upd-desktop"));
											},
										},
									],
								});
							}}
							style={{
								position: "absolute",
								left: `${item.position.custom === true ? item.position.left : Math.floor(Number(item.position.left) * 80)}px`,
								top: `${item.position.custom === true ? item.position.top : Math.floor(Number(item.position.top) * 66)}px`,
							}}
						>
							<div class="absolute z-[1] size-full rounded-md bg-[#ffffff10] backdrop-blur-xl opacity-0 shadow-tb-border-shadow group-hover:opacity-100 focus:opacity-100 duration-150 ease-in pointer-events-none select-none" />
							<div class="flex z-[2] size-full flex-col items-center justify-center pointer-events-none">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 pointer-events-none select-none">
									<path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
								</svg>
								<span class="leading-none bg-transparent text-white text-center select-none w-16" style={{ "text-shadow": "0 0 4px #00000052" }}>
									{item.name.length > 12 ? `${item.name.slice(0, 10)}...` : item.name}
								</span>
							</div>
						</div>
					) : (
						<div
							data-type="shortcut"
							title={item.name}
							id="desktop-item"
							class="group relative size-max min-w-16 min-h-16 flex flex-col items-center justify-center p-2 text-sm font-medium text-wrap select-none"
							onDblClick={() => {
								createWindow(item.config);
							}}
							style={{
								position: "absolute",
								left: `${item.position.custom === true ? item.position.left : Math.floor(Number(item.position.left) * 80)}px`,
								top: `${item.position.custom === true ? item.position.top : Math.floor(Number(item.position.top) * 66)}px`,
							}}
							onMouseDown={(e: MouseEvent) => onMouseDown(e, i())}
							onContextMenu={(e: MouseEvent) => {
								setDragging(false);
								setDraggedItemIndex(null);
								setDragradius(false);
								e.preventDefault();
								window.tb.contextmenu.create({
									x: e.clientX - 50,
									y: e.clientY,
									options: [
										{
											text: "Open",
											click: () => {
												createWindow(item.config);
											},
										},
										{
											text: "Pin to Dock",
											click: () => {
												window.tb.desktop.dock.pin(item.config);
											},
										},
										{
											text: "Delete Shortcut",
											click: async () => {
												const stat = await Filer.fs.promises.stat(`/home/${user}/desktop/${item.item}`);
												if (stat.isDirectory()) {
													// @ts-expect-error
													await new Filer.fs.Shell().promises.rm(`/home/${user}/desktop/${item.item}`, { recursive: true });
												} else {
													await Filer.fs.promises.unlink(`/home/${user}/desktop/${item.item}`);
												}
												window.dispatchEvent(new Event("upd-desktop"));
											},
										},
									],
								});
							}}
						>
							<div class="absolute z-1 size-full rounded-md bg-[#ffffff10] backdrop-blur-xl opacity-0 shadow-tb-border-shadow group-hover:opacity-100 focus:opacity-100 duration-150 ease-in pointer-events-none select-none" />
							<div class="flex z-2 size-full flex-col items-center justify-center pointer-events-none">
								<img src={item.config.icon} alt={item.name} class="size-6 pointer-events-none select-none" />
								<span class="leading-none bg-transparent text-white text-center select-none w-16" style={{ "text-shadow": "0 0 4px #00000052" }}>
									{item.name.length > 12 ? `${item.name.slice(0, 10)}...` : item.name}
								</span>
							</div>
						</div>
					);
				}}
			</For>
		</div>
	);
};

interface WindowAreaProps {
	className: string;
}

const WindowArea = (props: WindowAreaProps) => {
	const windowStore = useWindowStore();
	const [prevShowing, showPrev] = createSignal(false);
	const [direction, setDirection] = createSignal<string | null>(null);

	const snapPrev = (pos: string) => {
		showPrev(true);
		setDirection(pos);
	};

	const FinishSnap = () => {
		showPrev(false);
	};

	const setClass = () => {
		switch (direction()) {
			case "left":
				return `
                    left-0 w-6/12 h-full
                    ${prevShowing() ? "translate-x-0" : "-translate-x-4"}
                `;
			case "right":
				return `
                    right-0 w-6/12 h-full
                    ${prevShowing() ? "translate-x-0" : "translate-x-4"}
                `;
			case "top":
				return `
                    left-0 right-0 w-full h-full
                    ${prevShowing() ? "translate-y-0" : "-translate-y-4"}
                `;
		}
	};

	return (
		<window-area
			class={`${props.className ?? props.className} relative`}
			onContextMenu={(e: MouseEvent) => {
				const pos = { x: e.clientX, y: e.clientY };
				window.tb.contextmenu.create({
					options: [
						{
							text: "Change Wallpaper",
							click: () => {
								window.tb.window.create({
									title: "Settings",
									icon: "/fs/apps/system/settings.tapp/icon.svg",
									src: "/fs/apps/system/settings.tapp/index.html",
								});
							},
						},
						{
							text: "New Folder",
							click: () => {
								window.tb.dialog.Message({
									title: "Enter the new name of the folder",
									onOk: async (val: any) => {
										const user = sessionStorage.getItem("currAcc");
										await Filer.fs.promises.mkdir(`/home/${user}/desktop/${val}`);
										const desktopConfig = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
										const getLastItem = () => {
											for (let i = desktopConfig.length - 1; i >= 0; i--) {
												if (!desktopConfig[i].position.custom) {
													return desktopConfig[i];
												}
											}
											return null;
										};
										const lastItem = getLastItem();
										const highestLeft = Math.max(...desktopConfig.map((item: any) => item.position.left));
										let topPos = 0;
										let leftPos = 0;

										if (lastItem && lastItem.position.top < 11) {
											topPos = Math.floor(lastItem.position.top + 1);
											leftPos = lastItem.position.left;
										} else {
											leftPos = Math.floor(highestLeft + 1);
										}

										desktopConfig.push({
											name: val,
											item: `/home/${user}/desktop/${val}`,
											position: {
												custom: false,
												top: topPos,
												left: leftPos,
											},
										});
										await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
										window.dispatchEvent(new Event("upd-desktop"));
									},
								});
							},
						},
						{
							text: "New File",
							click: () => {
								window.tb.dialog.Message({
									title: "Enter the new name of the file",
									onOk: async (val: any) => {
										const user = sessionStorage.getItem("currAcc");
										await Filer.fs.promises.writeFile(`/home/${user}/desktop/${val}`, "", "utf8");
										const desktopConfig = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
										const getLastItem = () => {
											for (let i = desktopConfig.length - 1; i >= 0; i--) {
												if (!desktopConfig[i].position.custom) {
													return desktopConfig[i];
												}
											}
											return null;
										};
										const lastItem = getLastItem();
										const highestLeft = Math.max(...desktopConfig.map((item: any) => item.position.left));
										let topPos = 0;
										let leftPos = 0;

										if (lastItem && lastItem.position.top < 11) {
											topPos = Math.floor(lastItem.position.top + 1);
											leftPos = lastItem.position.left;
										} else {
											leftPos = Math.floor(highestLeft + 1);
										}

										desktopConfig.push({
											name: val,
											item: `/home/${user}/desktop/${val}`,
											position: {
												custom: false,
												top: topPos,
												left: leftPos,
											},
										});
										await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
										window.dispatchEvent(new Event("upd-desktop"));
									},
								});
							},
						},
						{
							text: "New Shortcut",
							click: async () => {
								const make = async (item: any) => {
									const user = sessionStorage.getItem("currAcc");
									const desktopConfig = JSON.parse(await Filer.fs.promises.readFile(`/home/${user}/desktop/.desktop.json`, "utf8"));
									const getLastItem = () => {
										for (let i = desktopConfig.length - 1; i >= 0; i--) {
											if (!desktopConfig[i].position.custom) {
												return desktopConfig[i];
											}
										}
										return null;
									};
									const lastItem = getLastItem();
									const highestLeft = Math.max(...desktopConfig.map((item: any) => item.position.left));
									let topPos = 0;
									let leftPos = 0;

									if (lastItem && lastItem.position.top < 11) {
										topPos = Math.floor(lastItem.position.top + 1);
										leftPos = lastItem.position.left;
									} else {
										leftPos = Math.floor(highestLeft + 1);
									}

									if (topPos * 66 > window.innerHeight - 130) {
										leftPos = 1.3;
										topPos = 0;
									}

									const aname = item.split("/").pop();
									if (aname.includes(".tapp")) {
										let tconf: any;
										if (await fileExists(`${item}/.tbconfig`)) {
											tconf = JSON.parse(await Filer.fs.promises.readFile(`${item}/.tbconfig`, "utf8"));
										} else {
											tconf = JSON.parse(await Filer.fs.promises.readFile(`${item}/index.json`, "utf8"));
										}
										await Filer.fs.promises.writeFile(
											`${item}/desktopcfg.json`,
											JSON.stringify({
												name: aname.replace(".tapp", ""),
												config: {
													...(tconf.wmArgs ? tconf.wmArgs : tconf.config),
													icon: `/fs/${item}/${tconf.wmArgs ? tconf.wmArgs.icon : tconf.config.icon}`,
													src: `/fs/${item}/${tconf.wmArgs ? tconf.wmArgs.src : tconf.config.src}`,
												},
												icon: `/fs/${item}/${tconf.icon}`,
											}),
										);
										await Filer.fs.promises.symlink(`${item}/desktopcfg.json`, `/home/${user}/desktop/${aname.replace(".tapp", "")}.lnk`, "file");
										desktopConfig.push({
											name: aname.replace(".tapp", ""),
											item: `/home/${user}/desktop/${aname.replace(".tapp", "")}.lnk`,
											position: {
												custom: false,
												top: topPos,
												left: leftPos,
											},
										});
									} else {
										desktopConfig.push({
											name: aname.replace(".tapp", ""),
											item: item,
											position: {
												custom: false,
												top: topPos,
												left: leftPos,
											},
										});
									}
									await Filer.fs.promises.writeFile(`/home/${user}/desktop/.desktop.json`, JSON.stringify(desktopConfig, null, 4));
									window.dispatchEvent(new Event("upd-desktop"));
								};
								await window.tb.dialog.Select({
									title: "Select the type of Shortcut",
									options: [
										{
											text: "Application",
											value: "app",
										},
										{
											text: "Folder",
											value: "dir",
										},
										{
											text: "File",
											value: "file",
										},
									],
									onOk: async (val: any) => {
										switch (val) {
											case "app":
												window.tb.dialog.DirectoryBrowser({
													title: "Select a application",
													filter: ".tapp",
													onOk: async (val: any) => {
														make(val);
													},
												});
												break;
											case "dir":
												window.tb.dialog.DirectoryBrowser({
													title: "Select a application",
													onOk: async (val: any) => {
														make(val);
													},
												});
												break;
											case "file":
												window.tb.dialog.FileBrowser({
													title: "Select a application",
													onOk: async (val: any) => {
														make(val);
													},
												});
												break;
										}
									},
								});
							},
						},
					],
					x: pos.x,
					y: pos.y,
				});
			}}
		>
			<DesktopItems />
			<For each={windowStore.windows}>
				{(window: any) => {
					return <WindowElement config={window} onSnapPreview={snapPrev} onSnapDone={FinishSnap} />;
				}}
			</For>
			<div
				class={
					`
                    absolute top-0 bottom-0 rounded-lg backdrop-blur bg-slate-700 bg-opacity-50 duration-150 bg-[url(/assets/img/grain.png)] pointer-events-none
                    ${prevShowing() ? "opacity-100 duration-200" : "opacity-0"}
                ` +
					" " +
					setClass()
				}
			/>
		</window-area>
	);
};

export const createWindow = async (config: WindowConfig) => {
	if (config.single) {
		const eWindow = globalWindowStore.windows.find((w: any) => w.src === config.src);
		if (eWindow) {
			if (config.message) {
				globalThis.postMessage(config.message as any, "*");
			}
			return;
		}
	}

	await storeAddWindow(config);
	return true;
};

export const removeWindow = (wid: string) => {
	// Did this for adding windows via COM
	// Call the store's removeWindow directly to avoid creating computations outside roots
	import("../Store").then(m => m.removeWindow(wid));
};

export const killWindow = (wid: string) => {
	// Did this for adding windows via COM
	import("../Store").then(m => m.killWindow(wid));
};

export default WindowArea;
