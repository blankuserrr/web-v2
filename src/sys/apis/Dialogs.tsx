import Compressor from "compressorjs";
import Cropper from "cropperjs";
import { createEffect, createSignal, For, onMount } from "solid-js";
import "../gui/styles/cropper.css";
import "../gui/styles/dialog.css";
import type { dialogProps } from "../types";

export type dialogType = "alert" | "message" | "select" | "auth" | "permissions" | "filebrowser" | "directorybrowser" | "savefile" | "cropper" | "webauth";

export let setDialogFn: (type: dialogType, props: dialogProps, options?: { sudo: boolean }) => void;
export let removeFn: () => void;

export default function DialogContainer() {
	const [dialogType, setDialogType] = createSignal<dialogType | null>(null);
	const [dialogProps, setDialogProps] = createSignal<dialogProps | {}>({});
	const [sudo, setSudo] = createSignal<boolean | null>(null);

	const remove = () => {
		setDialogType(null);
		setDialogProps({});
	};

	const setDialog = (type: dialogType, props: dialogProps, options?: { sudo: boolean }) => {
		setDialogType(type);
		setDialogProps(props);
		setSudo(options?.sudo || null);
	};

	/**
	 * @returns Components for COM
	 * @author XSTARS
	 */
	onMount(() => {
		setDialogFn = setDialog;
		removeFn = remove;
	});

	return (
		<>
			{dialogType() === "alert" && <Alert {...(dialogProps() as dialogProps)} />}
			{dialogType() === "message" && <Message {...(dialogProps() as dialogProps)} />}
			{dialogType() === "select" && <Select {...(dialogProps() as dialogProps)} />}
			{dialogType() === "auth" && <Auth {...(dialogProps() as dialogProps)} sudo={sudo() || false} />}
			{dialogType() === "permissions" && <Permissions {...(dialogProps() as dialogProps)} />}
			{dialogType() === "filebrowser" && <FileBrowser {...(dialogProps() as dialogProps)} />}
			{dialogType() === "directorybrowser" && <DirectoryBrowser {...(dialogProps() as dialogProps)} />}
			{dialogType() === "savefile" && <SaveFile {...(dialogProps() as dialogProps)} />}
			{dialogType() === "cropper" && <Crop {...(dialogProps() as dialogProps)} />}
			{dialogType() === "webauth" && <WebAuth {...(dialogProps() as dialogProps)} />}
		</>
	);
}

export function Alert({ title, message, onOk }: dialogProps) {
	let container: HTMLDivElement;
	let dialog: HTMLDivElement;

	const OK = () => {
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				container?.remove();
				if (onOk) onOk();
			}, 200);
		}
		removeFn();
	};

	onMount(() => {
		const handleClick = (e: MouseEvent) => {
			if (container && e.target !== dialog && e.target === container) {
				if (onOk) onOk();
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	});

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				<div class="dialog-message">{message}</div>
				<div class="flex justify-end">
					<button type="button" class="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Message({ title, defaultValue, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	let container: HTMLDivElement;
	let dialog: HTMLDivElement;
	let inputRef: HTMLInputElement;

	const OK = () => {
		const inpVal = inputRef?.value;
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				container?.remove();
				if (onOk && inpVal !== undefined) {
					onOk(inpVal);
				}
			}, 200);
			removeFn();
		}
	};

	const Cancel = () => {
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				container?.remove();
				if (onCancel) {
					onCancel();
				}
			}, 200);
			removeFn();
		}
	};

	const onDown = (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			OK();
		}
	};

	onMount(() => {
		const handleClick = (e: MouseEvent) => {
			if (container && e.target !== dialog && e.target === container) {
				Cancel();
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	});

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				<input type="text" value={defaultValue} class="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150" style={{ width: "100%" }} ref={inputRef} onKeyDown={onDown} />
				<div class="flex justify-between">
					<button type="button" class="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<button type="button" class="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Select({ title, options, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	let container: HTMLDivElement;
	let dialog: HTMLDivElement;

	const OK = (value: string) => {
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				container?.remove();
				if (onOk) {
					onOk(value);
				}
			}, 200);
			removeFn();
		}
	};

	const Cancel = () => {
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				container?.remove();
				if (onCancel) {
					onCancel();
				}
			}, 200);
			removeFn();
		}
	};

	onMount(() => {
		const handleClick = (e: MouseEvent) => {
			if (container && e.target !== dialog && e.target === container) {
				Cancel();
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	});

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				<div class="grid grid-cols-4 gap-2">
					<For each={options}>
						{(option: { text: string; value: string }) => (
							<button type="button" class="py-1.5 px-2.5 rounded-md bg-[#ffffff10] hover:bg-[#ffffff28] shadow-tb-border-shadow duration-150 cursor-pointer" onMouseDown={() => OK(option.value)}>
								{option.text}
							</button>
						)}
					</For>
				</div>
			</div>
		</div>
	);
}

export function Auth({ title, defaultUsername, onOk, onCancel, sudo }: dialogProps) {
	if (!title) throw new Error("title is required");
	let container: HTMLDivElement;
	let dialog: HTMLDivElement;
	let usernameRef: HTMLInputElement;
	let passwordRef: HTMLInputElement;

	const OK = () => {
		const username = usernameRef?.value;
		const password = passwordRef?.value;
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				if (container) {
					removeFn();
				}
				if (onOk && username && password) {
					onOk(username, password);
				}
			}, 200);
		}
	};

	const Cancel = () => {
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				if (container) {
					removeFn();
				}
				if (onCancel) {
					onCancel();
				}
			}, 200);
		}
	};

	const onDown = (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			OK();
		}
	};

	onMount(() => {
		const handleClick = (e: MouseEvent) => {
			if (container && e.target !== dialog && e.target === container) {
				Cancel();
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	});

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				<input
					type="text"
					disabled={true}
					value={sudo ? "sudo" : defaultUsername}
					placeholder="Username"
					class={`
                        ${sudo ? "p-2 pl-4 rounded-lg bg-[#ffffff08] outline-hidden shadow-tb-border-shadow" : "p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow"}
                    `}
					style={{ width: "100%" }}
					ref={usernameRef}
				/>
				<input type="password" placeholder="Password" class="p-2 pl-4 rounded-lg bg-[#ffffff20] cursor-text outline-hidden shadow-tb-border-shadow duration-150" style={{ width: "100%" }} ref={passwordRef} onKeyDown={onDown} />
				<div class="flex justify-between">
					<button type="button" class="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<button type="button" class="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Permissions({ title, message, onOk, onCancel }: dialogProps) {
	if (!message) throw new Error("message is required");
	let container: HTMLDivElement;
	let dialog: HTMLDivElement;

	const OK = () => {
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				container?.remove();
				if (onOk) {
					onOk();
				}
			}, 200);
			removeFn();
		}
	};

	const Cancel = () => {
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				container?.remove();
				if (onCancel) {
					onCancel();
				}
			}, 200);
			removeFn();
		}
	};

	onMount(() => {
		const handleClick = (e: MouseEvent) => {
			if (container && e.target !== dialog && e.target === container) {
				Cancel();
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	});

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				<div class="dialog-message">{message}</div>
				<div class="flex justify-between">
					<button type="button" class="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<div class="dialog-action-buttons">
						<button type="button" class="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
							OK
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function FileBrowser({ title, filter, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	const [selectedEntry, setSelectedEntry] = createSignal<string | null>(null);
	const [currentDirectory, setCurrentDirectory] = createSignal<string>("/");
	const [fileEntries, setFileEntries] = createSignal<{ entry: string; isDirectory: boolean }[]>([]);
	const [loading, setLoading] = createSignal<boolean>(true);
	const [showBackButton, setShowBackButton] = createSignal<boolean>(false);
	const anura = window.parent.anura;

	const openDirectory = async (directory: string) => {
		setLoading(true);
		try {
			const entries = await anura.fs.promises.readdir(directory);
			const entriesInfo = await Promise.all(
				entries.map(async (entry: string) => {
					const fileInfo = await anura.fs.promises.stat(`${directory}/${entry}`);
					const isDirectory = fileInfo.isDirectory();
					if (!filter || isDirectory || (filter !== "*.*" && entry.endsWith(filter))) {
						return { entry, isDirectory };
					}
					return null;
				}),
			);
			setFileEntries(entriesInfo.filter(Boolean) as { entry: string; isDirectory: boolean }[]);
			setShowBackButton(directory !== "//");
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	createEffect(() => {
		openDirectory(currentDirectory());
	});

	const entClick = (entry: string, isDirectory: boolean) => {
		if (isDirectory) {
			setCurrentDirectory(`${currentDirectory()}/${entry}`);
		} else {
			let currentDir = currentDirectory();
			if (currentDir.startsWith("///")) {
				currentDir = currentDir.slice(3);
				setCurrentDirectory(currentDir);
			}
			setSelectedEntry(`${currentDir}/${entry}`);
			const files = document.querySelectorAll(".file-item");
			files.forEach(file => {
				if (file.getAttribute("data-entry") !== entry) {
					file.classList.remove("bg-[#ffffff18]");
				}
			});
		}
	};

	const OK = () => {
		setTimeout(() => {
			removeFn();
			if (onOk) {
				onOk(selectedEntry());
			}
		}, 300);
	};

	const Cancel = () => {
		return new Promise((_, reject) => {
			setTimeout(() => {
				reject("Canceled");
				removeFn();
				if (onCancel) {
					onCancel();
				}
			}, 300);
		});
	};

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150">
			<div class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				{loading() ? (
					<div class="font-medium text-lg">Loading...</div>
				) : (
					<div class={`overflow-y-auto min-h-[100px] max-h-[300px] ${fileEntries().length === 0 ? " flex justify-center items-center" : "bg-[#ffffff10] shadow-tb-border-shadow rounded-lg"}`}>
						{fileEntries().length === 0 ? (
							<div class="font-extrabold text-xl select-none">No files found</div>
						) : (
							<For each={fileEntries()}>
								{({ entry, isDirectory }) => (
									<div
										data-entry={entry}
										class="file-item flex gap-2 items-center select-none p-1.5 first:rounded-t-lg last:rounded-b-lg duration-150 cursor-pointer hover:bg-[#ffffff08]"
										onMouseDown={(e: MouseEvent) => {
											entClick(entry, isDirectory);
											(e.currentTarget as HTMLElement).classList.add("bg-[#ffffff18]");
										}}
									>
										<div class="flex gap-2 items-center">
											{isDirectory ? (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-10 pointer-events-none" aria-label="Folder">
													<path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
												</svg>
											) : (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-10 pointer-events-none" aria-label="File">
													<path
														fill-rule="evenodd"
														d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
														clip-rule="evenodd"
													/>
													<path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
												</svg>
											)}
											<div class="font-semibold text-lg">{entry}</div>
										</div>
									</div>
								)}
							</For>
						)}
					</div>
				)}
				<div class="flex justify-between">
					<button type="button" class="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					{showBackButton() && (
						<button
							type="button"
							class="dialog-button goBack-button cursor-pointer"
							onMouseDown={() => {
								const parts = currentDirectory().split("/");
								parts.pop();
								const inp = `${parts.join("/")}/`;
								setCurrentDirectory(inp);
							}}
						>
							Go Back
						</button>
					)}
					<button
						type="button"
						class={`${selectedEntry() ? "flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" : "flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#ffffff10] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#ffffff18] duration-150"}`}
						onMouseDown={OK}
						disabled={!selectedEntry()}
					>
						Select
					</button>
				</div>
			</div>
		</div>
	);
}

export function DirectoryBrowser({ title, defualtDir, onOk, onCancel }: dialogProps) {
	const [selectedEntry, setSelectedEntry] = createSignal<string | null>(null);
	const [fileEntries, setFileEntries] = createSignal<{ entry: string; isDirectory: boolean }[]>([]);
	const [loading, setLoading] = createSignal<boolean>(true);
	const [currentDirectory, setCurrentDirectory] = createSignal<string>(defualtDir || "/");
	const anura = window.parent.anura;

	const openDirectory = async (directory: string) => {
		setLoading(true);
		try {
			const entries = await anura.fs.promises.readdir(directory);
			const entriesInfo = await Promise.all(
				entries.map(async (entry: string) => {
					const fileInfo = await anura.fs.promises.stat(`${directory}/${entry}`);
					return { entry, isDirectory: fileInfo.isDirectory() };
				}),
			);
			const directories = entriesInfo.filter(info => info.isDirectory);
			setFileEntries(directories);
			if (directory.startsWith("//")) {
				setCurrentDirectory(directory.slice(1));
			} else {
				setCurrentDirectory(directory);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	createEffect(() => {
		openDirectory(currentDirectory());
	});

	const Select = () => {
		if (selectedEntry()) {
			setTimeout(() => {
				removeFn();
				if (onOk) {
					onOk(selectedEntry());
				}
			}, 300);
		}
	};

	const Cancel = () => {
		return new Promise((_, reject) => {
			setTimeout(() => {
				reject("Canceled");
				removeFn();
				if (onCancel) {
					onCancel();
				}
			}, 300);
		});
	};

	const onChange = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			openDirectory((e.target as HTMLInputElement).value);
		}
	};

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150">
			<div class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				{loading() ? (
					<div>Loading...</div>
				) : (
					<div class={`overflow-y-auto min-h-[100px] max-h-[300px] ${fileEntries().length === 0 ? " flex justify-center items-center" : "bg-[#ffffff10] shadow-tb-border-shadow rounded-lg"}`}>
						{fileEntries().length === 0 ? (
							<div class="font-extrabold text-xl select-none">No directories found</div>
						) : (
							<For each={fileEntries()}>
								{({ entry }) => (
									<div
										data-entry={entry}
										class="file-item flex gap-2 items-center select-none p-1.5 first:rounded-t-lg last:rounded-b-lg duration-150 cursor-pointer hover:bg-[#ffffff08]"
										onDblClick={() => {
											if (currentDirectory().endsWith("/")) {
												setCurrentDirectory(`${currentDirectory()}${entry}`);
											} else {
												setCurrentDirectory(`${currentDirectory()}/${entry}`);
											}
										}}
										onMouseDown={(e: MouseEvent) => {
											if (currentDirectory().endsWith("/")) {
												setSelectedEntry(`${currentDirectory()}${entry}`);
											} else {
												setSelectedEntry(`${currentDirectory()}/${entry}`);
											}
											const files = document.querySelectorAll(".file-item");
											files.forEach(file => {
												if (file.getAttribute("data-entry") !== entry) {
													file.classList.remove("bg-[#ffffff18]");
												}
											});
											(e.currentTarget as HTMLElement).classList.add("bg-[#ffffff18]");
										}}
									>
										<div class="flex gap-2 items-center">
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-10 pointer-events-none" aria-label="Folder">
												<path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
											</svg>
											<div class="font-semibold text-lg">{entry}</div>
										</div>
									</div>
								)}
							</For>
						)}
					</div>
				)}
				<div class="flex justify-between">
					<button type="button" class="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<input type="text" class="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150" value={currentDirectory()} placeholder="Directory" onKeyDown={onChange} onChange={e => setCurrentDirectory(e.currentTarget.value)} />
					<button
						type="button"
						class={`${selectedEntry() ? "flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" : "flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#ffffff10] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#ffffff18] duration-150"}`}
						onMouseDown={Select}
						disabled={!selectedEntry()}
					>
						Select
					</button>
				</div>
			</div>
		</div>
	);
}

export function SaveFile({ title, defualtDir, filename, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	const [selectedEntry, setSelectedEntry] = createSignal<string | null>(null);
	const [fileEntries, setFileEntries] = createSignal<{ entry: string; isDirectory: boolean }[]>([]);
	const [loading, setLoading] = createSignal<boolean>(true);
	const [currentDirectory, setCurrentDirectory] = createSignal<string>(defualtDir || "//");
	let fileInp: HTMLInputElement;
	const anura = window.parent.anura;

	const openDirectory = async (directory: string) => {
		setLoading(true);
		try {
			const entries = await anura.fs.promises.readdir(directory);
			const entriesInfo = await Promise.all(
				entries.map(async (entry: string) => {
					const fileInfo = await anura.fs.promises.stat(`${directory}/${entry}`);
					return { entry, isDirectory: fileInfo.isDirectory() };
				}),
			);
			setFileEntries(entriesInfo);
			setLoading(false);
		} catch (error) {
			console.error(error);
			setLoading(false);
		}
	};

	createEffect(() => {
		openDirectory(currentDirectory());
	});

	const Select = (entry: string, isDirectory: boolean) => {
		if (isDirectory) {
			if (fileInp) {
				fileInp.value = `${currentDirectory()}/${entry}/${filename || "file.txt"}`;
			}
			setCurrentDirectory(`${currentDirectory()}/${entry}`);
		} else {
			if (fileInp) {
				fileInp.value = `${currentDirectory()}/${entry}/${filename || "file.txt"}`;
			}
			setSelectedEntry(`${currentDirectory()}/${entry}`);
		}
	};

	const onSave = () => {
		const fileName = fileInp?.value;
		removeFn();
		if (fileName) {
			setTimeout(() => {
				console.log(fileName);
				if (onOk) {
					onOk(fileName);
				}
			}, 300);
		}
	};

	const Cancel = () => {
		removeFn();
		if (onCancel) {
			onCancel();
		}
	};

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150">
			<div class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				{loading() ? (
					<div>Loading...</div>
				) : (
					<div class={`overflow-y-auto min-h-[100px] max-h-[300px] ${fileEntries().length === 0 ? " flex justify-center items-center" : "bg-[#ffffff10] shadow-tb-border-shadow rounded-lg"}`}>
						{fileEntries().length === 0 ? (
							<div class="font-extrabold text-xl select-none">No directories found</div>
						) : (
							<For each={fileEntries()}>
								{({ entry, isDirectory }) => (
									<div data-entry={entry} class="file-item flex gap-2 items-center select-none p-1.5 first:rounded-t-lg last:rounded-b-lg duration-150 cursor-pointer hover:bg-[#ffffff08]" onMouseDown={() => Select(entry, isDirectory)}>
										<div class="flex gap-2 items-center">
											{isDirectory ? (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-10 pointer-events-none" aria-label="Folder">
													<path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
												</svg>
											) : (
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-10 pointer-events-none" aria-label="File">
													<path
														fill-rule="evenodd"
														d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
														clip-rule="evenodd"
													/>
													<path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
												</svg>
											)}
											<div class="font-semibold text-lg">{entry}</div>
										</div>
									</div>
								)}
							</For>
						)}
					</div>
				)}
				<div class="flex justify-between">
					<button type="button" class="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<input
						ref={fileInp}
						type="text"
						value={selectedEntry() || `${currentDirectory()}/${filename || "file.txt"}`}
						placeholder="Enter file name"
						class="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150"
						onKeyDown={e => {
							if (e.key === "Enter") {
								const inputPath = fileInp.value;
								if (inputPath.endsWith("/")) {
									setCurrentDirectory(inputPath);
								} else {
									onSave();
								}
							}
						}}
						onChange={e => setSelectedEntry(e.currentTarget.value)}
					/>
					<button type="button" class="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={onSave}>
						Select
					</button>
				</div>
			</div>
		</div>
	);
}

export function Crop({ title, img, onOk, onCancel }: dialogProps) {
	let imgRef: HTMLImageElement;
	let cropperRef: Cropper | null = null;

	onMount(() => {
		if (imgRef && img) {
			imgRef.src = img;
			cropperRef = new Cropper(imgRef, {
				cropBoxResizable: false,
				movable: true,
				rotatable: true,
				scalable: true,
				responsive: true,
			});
		}
		return () => {
			if (cropperRef && typeof cropperRef.destroy === "function") {
				cropperRef.destroy();
			}
		};
	});

	const onSave = () => {
		if (!cropperRef) return;
		const canvas = (cropperRef as any).getCroppedCanvas();
		canvas.toBlob((blob: Blob | null) => {
			if (blob) {
				new Compressor(blob, {
					quality: 0.5,
					success(result) {
						const reader = new FileReader();
						reader.readAsDataURL(result);
						reader.onload = () => {
							removeFn();
							setTimeout(() => {
								if (onOk) {
									onOk(reader.result);
								}
							}, 300);
						};
					},
				});
			}
		});
	};

	const Cancel = () => {
		removeFn();
		if (onCancel) {
			onCancel();
		}
	};

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150">
			<div class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				<img ref={imgRef} class="w-full h-24" alt="Crop preview" />
				<div class="flex justify-between">
					<button type="button" class="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<button type="button" class="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={onSave}>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

export function WebAuth({ title, defaultUsername, onOk, onCancel }: dialogProps) {
	if (!title) throw new Error("title is required");
	let container: HTMLDivElement;
	let dialog: HTMLDivElement;
	let usernameRef: HTMLInputElement;
	let passwordRef: HTMLInputElement;

	const OK = () => {
		const username = usernameRef?.value;
		const password = passwordRef?.value;
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				if (container) {
					removeFn();
				}
				if (onOk && username && password) {
					onOk(username, password);
				}
			}, 200);
		}
	};

	const Cancel = () => {
		if (container) {
			container.classList.add("fade-out");
			setTimeout(() => {
				if (container) {
					removeFn();
				}
				if (onCancel) {
					onCancel();
				}
			}, 200);
		}
	};

	const onDown = (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			OK();
		}
	};

	onMount(() => {
		const handleClick = (e: MouseEvent) => {
			if (container && e.target !== dialog && e.target === container) {
				Cancel();
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	});

	return (
		<div class="fixed inset-0 z-999999999 flex flex-col items-center justify-center bg-[#00000078] backdrop-blur-xs duration-150" ref={container}>
			<div ref={dialog} class="flex flex-col p-2.5 gap-2.5 backdrop-blur-md rounded-lg sm:min-w-[340px] md:min-w-[400px] lg:min-w-[600px] bg-[#ffffff18] text-white shadow-tb-border-shadow duration-150">
				<div class="font-extrabold text-xl leading-none select-none">{title}</div>
				<input type="text" value={defaultUsername} placeholder="Username" class="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150" style={{ width: "100%" }} ref={usernameRef} />
				<input type="password" placeholder="Password" class="p-2 pl-4 rounded-lg bg-[#ffffff16] cursor-text outline-hidden shadow-tb-border-shadow duration-150" style={{ width: "100%" }} ref={passwordRef} onKeyDown={onDown} />
				<div class="flex justify-between">
					<button type="button" class="p-2 text-[#ffffff78] cursor-pointer hover:text-white duration-150" onMouseDown={Cancel}>
						Cancel
					</button>
					<button type="button" class="flex gap-1.5 w-max py-2 px-5 rounded-md cursor-pointer bg-[#86ff9085] shadow-[0px_0px_6px_0px_#00000052,_inset_0_0_0_0.5px_#ffffff38] hover:bg-[#8fff98a2] duration-150" onMouseDown={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}
