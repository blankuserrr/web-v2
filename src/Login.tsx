import { type Component, createEffect, createSignal, For, onMount, Show } from "solid-js";
import pwd from "./sys/apis/Crypto";
import { GetDate, GetTime } from "./sys/apis/Date";
import DialogContainer, { setDialogFn } from "./sys/apis/Dialogs";
import "./sys/gui/styles/login.css";
import type { User } from "./sys/types";

const pw = new pwd();

const Login: Component = () => {
	const [isLoggingIn, setIsLoggingIn] = createSignal(false);
	const [time, setTime] = createSignal(GetTime());
	const [date, setDate] = createSignal(GetDate());
	const [hasPw, setHasPw] = createSignal(false);
	const [accounts, setAccounts] = createSignal<string[]>([]);
	const [selectedUser, setSelectedUser] = createSignal<string>(sessionStorage.getItem("currAcc") || "/home/user/");
	const [profilePictures, setProfilePictures] = createSignal<{ [key: string]: string | null }>({});
	const [wallpaper, setWallpaper] = createSignal<string | null>(null);
	const [changingpw, setChangepw] = createSignal(false);
	let passwordRef!: HTMLInputElement;

	onMount(() => {
		const intervalId = setInterval(() => {
			setTime(GetTime());
			setDate(GetDate());
		}, 1000);

		const FS = async () => {
			const entries = await Filer.fs.promises.readdir("/home/");
			const dirEntries = await Promise.all(
				entries.map(async entry => {
					const stat = await Filer.fs.promises.stat(`/home/${entry}`);
					if (stat.isDirectory()) {
						try {
							await Filer.fs.promises.access(`/home/${entry}/user.json`);
							return entry;
						} catch (_error) {
							return null;
						}
					}
				}),
			);
			const directories = dirEntries.filter((entry): entry is string => entry !== null);
			setAccounts(directories);
		};
		FS();

		const getDefUsr = async () => {
			const data = await Filer.fs.promises.readFile("/system/etc/terbium/settings.json", "utf8");
			const res = JSON.parse(data);
			const userSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${res.defaultUser}/settings.json`, "utf8"));
			setWallpaper(userSettings.wallpaper);
			setSelectedUser(res.defaultUser);
		};
		getDefUsr();

		return () => clearInterval(intervalId);
	});

	createEffect(async () => {
		const accs = accounts();
		const selUser = selectedUser();

		if (accs.length > 0) {
			const pictures: { [key: string]: string | null } = {};
			for (const account of accs) {
				try {
					const res = JSON.parse(await Filer.fs.promises.readFile(`/home/${account}/user.json`, "utf8"));
					pictures[account] = res.pfp || null;
				} catch (error) {
					console.error(`Error reading user data for ${account}:`, error);
					pictures[account] = null;
				}
			}
			setProfilePictures(pictures);
		}

		if (selUser && selUser !== "/home/user/") {
			try {
				const res = JSON.parse(await Filer.fs.promises.readFile(`/home/${selUser}/user.json`, "utf8"));
				setHasPw(res.password !== false);
			} catch (error) {
				console.error("Error reading user data:", error);
			}
		}
	});

	const login = async () => {
		const passVal = passwordRef.value;
		if (passVal !== "") {
			const data = await Filer.fs.promises.readFile(`/home/${selectedUser()}/user.json`, "utf8");
			const res = JSON.parse(data);
			const user_pass = res.password.toString();
			const pass = pw.harden(passVal.toString());
			if (user_pass === pass) {
				sessionStorage.setItem("logged-in", "true");
				sessionStorage.setItem("currAcc", selectedUser());
				window.location.reload();
			} else {
				Err();
			}
		}
	};
	const Err = () => {
		if (passwordRef) {
			passwordRef.classList.add("ring-[#ff7e7e5a]", "ring-[2px]", "border-[#ff7e7ed5]", "placeholder-[#ff7e7e6b]");
			passwordRef.value = "";
			passwordRef.placeholder = "Incorrect Password";
			passwordRef.addEventListener("keydown", () => {
				if (passwordRef) {
					passwordRef.classList.remove("ring-[#ff7e7e5a]", "ring-[2px]", "border-[#ff7e7ed5]", "placeholder-[#ff7e7e6b]");
					passwordRef.placeholder = "Password";
				}
			});
		}
	};

	createEffect(() => {
		const keyCheck = async (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsLoggingIn(false);
			}
			if ((!isLoggingIn() && e.key !== "Escape") || e.key.match(/^[a-zA-Z0-9]$/)) {
				const user = JSON.parse(await Filer.fs.promises.readFile(`/home/${selectedUser()}/user.json`, "utf8"));
				if (user.password !== false) {
					setIsLoggingIn(true);
					setTimeout(() => {
						if (passwordRef && !changingpw()) {
							passwordRef.focus();
							if (e.key.match(/^[a-zA-Z0-9]$/) && passwordRef.value.length === 0) {
								passwordRef.value = e.key;
							}
						}
					}, 200);
				}
			}
		};
		window.addEventListener("keydown", keyCheck);

		return () => {
			window.removeEventListener("keydown", keyCheck);
		};
	});

	return (
		<>
			<div
				class="absolute inset-0"
				style={{
					"background-image": `url("${wallpaper()?.includes("/system/etc/") ? `/fs/${wallpaper()}` : wallpaper() || ""}")`,
					"background-size": "cover",
				}}
			/>
			<div
				class={"login_container relative flex flex-col justify-center items-center size-full gap-5"}
				onMouseDown={() => {
					if (!isLoggingIn()) {
						if (hasPw()) {
							setIsLoggingIn(true);
							setTimeout(() => {
								if (passwordRef && !changingpw()) {
									passwordRef.focus();
								}
							}, 200);
						}
					}
				}}
			>
				<Show when={accounts().length > 1}>
					<div
						class={`
                            absolute flex gap-4 top-5 right-5 items-center z-10 duration-150
                            ${isLoggingIn() ? "opacity-100" : "opacity-0 pointer-events-none translate-y-7"}
                        `}
					>
						<For each={accounts()}>
							{(account, _i) => (
								<div
									class={`
                                        size-14 bg-[#00000028] rounded-full duration-150
                                        ${selectedUser() === account ? "shadow-[inset_0_0_0_2px_#7e91ff] scale-[1.2]" : "hover:scale-[1.1]"}
                                    `}
									style={{ "background-image": `url("${profilePictures()[account] || ""}")`, "background-size": "cover", "background-position": "center", "background-repeat": "no-repeat" }}
									onMouseDown={async () => {
										setSelectedUser(account);
										const userSettings = JSON.parse(await Filer.fs.promises.readFile(`/home/${account}/settings.json`, "utf8"));
										setWallpaper(userSettings.wallpaper);
									}}
								/>
							)}
						</For>
					</div>
				</Show>
				<div
					class={`
                    flex flex-col justify-center items-center gap-5 size-full duration-150
                    ${isLoggingIn() ? "opacity-0 pointer-events-none" : "opacity-100"}
                `}
				>
					<div class="date_time text-[#ffffffcb] font-extrabold flex flex-col justify-center items-center [text-shadow:0_0_16px_#00000038]">
						<div class="time text-7xl">{time()}</div>
						<div class="date text-2xl">{date()}</div>
					</div>
					<h1 class="text-[#ffffffcb] text-xl font-bold">Press any key to login</h1>
				</div>
				<DialogContainer />
				<div
					class={`
                    absolute
                    flex flex-col justify-center items-center gap-5 size-full backdrop-blur-lg duration-150 ${wallpaper() ? "bg-[#0e0e0e99]" : "bg-[#0e0e0e]"}
                    ${isLoggingIn() ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
				>
					<div
						class={`
                        flex flex-col justify-center items-center gap-5 size-full duration-150
                        ${isLoggingIn() ? "" : "translate-y-6"}
                    `}
					>
						<div class="date_time text-[#ffffff87] font-extrabold flex flex-col justify-center items-center">
							<div class="time text-6xl">{time()}</div>
							<div class="date text-lg">{date()}</div>
						</div>
						<div class="user flex flex-row gap-5">
							<div class="user flex flex-col justify-center items-center gap-[10px]">
								<div class="relative flex size-[120px]">
									<Show
										when={accounts().length > 1}
										fallback={
											<div class="flex justify-center items-center border-[1px] border-[#ffffff10] rounded-full bg-[center] w-[120px] h-[120px]" style={{ "background-image": `url("${profilePictures()[selectedUser()] || ""}")`, "background-size": "102%", "background-repeat": "no-repeat" }}>
												<div
													class="text-xl font-bold"
													style={{
														"text-shadow": "0 0 16px #000000",
														color: "#ffffff",
													}}
												>
													{selectedUser()}
												</div>
											</div>
										}
									>
										<For each={accounts()}>
											{account => (
												<div
													class={`
                                                    absolute
                                                    flex justify-center items-center border-[1px] border-[#ffffff10] rounded-full bg-[center] size-[120px] duration-150
                                                    ${selectedUser() === account ? "" : "scale-[0.85] opacity-0"}
                                                `}
													style={{ "background-image": `url("${profilePictures()[account] || ""}")`, "background-size": "102%", "background-repeat": "no-repeat" }}
												>
													<div
														class="text-xl font-bold"
														style={{
															"text-shadow": "0 0 16px #000000",
															color: "#ffffff",
														}}
													>
														{account}
													</div>
												</div>
											)}
										</For>
									</Show>
								</div>
								<div class="pass_container flex gap-[6px] justify-center items-center">
									<div class="relative flex flex-row justify-center">
										<div
											class={`
                                            flex flex-col items-center gap-1.5 duration-150
                                            ${hasPw() ? "opacity-100" : "opacity-0 pointer-events-none"}
                                        `}
										>
											<div class="flex">
												<input
													type="password"
													class="pass cursor-[var(--cursor-text)] bg-[#ffffff10] border-[1px] border-[#ffffff10] rounded-[6px] px-[8px] py-[6px] text-[#ffffff] font-[18px] placeholder-[#ffffff38] placeholder-opacity-50 transition duration-150 ring-0 ring-[transparent] focus:outline-hidden focus:ring-[2.5px] focus:ring-[#7e91ff5a] focus:border-[#7e91ffd5] focus:placeholder-[#ffffff6b]"
													autoComplete="off"
													placeholder="Password"
													ref={passwordRef}
													onKeyDown={e => {
														if (e.key === "Enter") login();
													}}
												/>
												<button
													class="pass_button ml-2 cursor-pointer bg-[#ffffff10] border-[1px] border-[#ffffff10] rounded-[6px] px-[8px] py-[6px] stroke-[#ffffff] stroke-width-[2px] text-[#ffffff] font-[18px] transition duration-150 ring-0 ring-[transparent] focus:outline-hidden focus:ring-[2.5px] focus:ring-[#7e91ff5a] focus:border-[#7e91ffd5]"
													onMouseDown={login}
												>
													<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
														<path fill-rule="evenodd" d="M3.75 12a.75.75 0 01.75-.75h13.19l-5.47-5.47a.75.75 0 011.06-1.06l6.75 6.75a.75.75 0 010 1.06l-6.75 6.75a.75.75 0 11-1.06-1.06l5.47-5.47H4.5a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
													</svg>
												</button>
											</div>
											<Show when={hasPw()}>
												<div
													class="forgot cursor-pointer text-[#ffffff38] text-[16px] font-[700] transition duration-150 hover:text-[#ffffff87] focus:outline-hidden focus:text-[#ffffff87]"
													onMouseDown={async () => {
														const changepw = async () => {
															setChangepw(true);
															const settings: User = JSON.parse(await Filer.fs.promises.readFile(`/home/${selectedUser()}/user.json`, "utf8"));
															if (settings.securityQuestion) {
																setDialogFn("message", {
																	title: `${settings.securityQuestion.question}`,
																	onOk: (val: string) => {
																		if (pw.harden(val) === settings.securityQuestion?.answer) {
																			setDialogFn("message", {
																				title: `Enter a new Password for the account: ${selectedUser()}`,
																				onOk: (val: string) => {
																					settings.password = pw.harden(val);
																					Filer.fs.promises.writeFile(`/home/${selectedUser()}/user.json`, JSON.stringify(settings, null, 4));
																					setChangepw(false);
																					sessionStorage.setItem("logged-in", "true");
																					sessionStorage.setItem("currAcc", selectedUser());
																					window.location.reload();
																				},
																			});
																		} else {
																			setDialogFn("alert", {
																				title: "Incorrect answer to the security question",
																				onOk: () => {
																					changepw();
																				},
																			});
																		}
																	},
																});
															} else {
																setDialogFn("message", {
																	title: `Enter a new Password for the account: ${selectedUser()}`,
																	onOk: (val: string) => {
																		settings.password = pw.harden(val);
																		Filer.fs.promises.writeFile(`/home/${selectedUser()}/user.json`, JSON.stringify(settings, null, 4));
																		setChangepw(false);
																		sessionStorage.setItem("logged-in", "true");
																		sessionStorage.setItem("currAcc", selectedUser());
																		window.location.reload();
																	},
																});
															}
														};
														changepw();
													}}
												>
													Forgot Password?
												</div>
											</Show>
										</div>
										<button
											class={`
                                            absolute pass_button ml-2 cursor-pointer bg-[#ffffff10] border-[1px] border-[#ffffff10] rounded-[6px] px-[8px] py-[6px] stroke-[#ffffff] stroke-width-[2px] text-[#ffffff] font-[18px] transition duration-150 ring-0 ring-[transparent] focus:outline-hidden focus:ring-[2.5px] focus:ring-[#7e91ff5a] focus:border-[#7e91ffd5]
                                            ${hasPw() ? "opacity-0 pointer-events-none" : "opacity-100"}
                                        `}
											onMouseDown={() => {
												sessionStorage.setItem("logged-in", "true");
												sessionStorage.setItem("currAcc", selectedUser());
												window.location.reload();
											}}
										>
											Login
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Login;
