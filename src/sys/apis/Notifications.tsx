import { createSignal, For, onMount } from "solid-js";
import "../gui/styles/notification.css";
import type { NotificationProps } from "../types";

export let setNotifFn: (type: "message" | "toast" | "installing", props: NotificationProps) => void;
let notificationId = 0;
let notificationCount = 0;

export default function NotificationContainer() {
	const [notifications, setNotifications] = createSignal<{ id: number; type: "message" | "toast" | "installing"; props: NotificationProps }[]>([]);
	const remove = (id: number) => {
		setNotifications(prev => prev.filter(notif => notif.id !== id));
	};
	const setNotif = (type: "message" | "toast" | "installing", props: NotificationProps) => {
		const newNotification = { id: notificationId++, type, props };
		setNotifications(prev => [...prev, newNotification]);
	};
	/**
	 * @returns Components for COM
	 * @author XSTARS
	 */
	onMount(() => {
		setNotifFn = setNotif;
	});
	return (
		<div class="absolute grid grid-cols-1 h-max max-h-[calc(100%-calc(60px+1.5rem))] w-[380px] top-[60px] right-1.5 z-9999 gap-2">
			<For each={notifications()}>
				{({ id, type, props }) => {
					if (type === "message") {
						return <Message {...props} remove={() => remove(id)} />;
					}
					if (type === "toast") {
						return <Toast {...props} remove={() => remove(id)} />;
					}
					if (type === "installing") {
						return <Installing {...props} remove={() => remove(id)} />;
					}
				}}
			</For>
		</div>
	);
}

export function Message({ iconSrc, application, message, txt, onOk, onCancel, time, remove }: NotificationProps & { remove: () => void }) {
	if (!message) throw new Error("message is required");
	const [inputValue, setInputValue] = createSignal(txt || "");
	const [elapsedTime, setElapsedTime] = createSignal<string>("Now");
	onMount(() => {
		const startTime = Date.now();
		const int = setInterval(() => {
			const elapsed = Math.floor((Date.now() - startTime) / 60000);
			if (elapsed > 0) {
				setElapsedTime(`${elapsed}min ago`);
			} else if (elapsed > 60) {
				setElapsedTime(`${Math.floor(elapsed / 60)}h ago`);
			} else if (elapsed > 1440) {
				setElapsedTime(`${Math.floor(elapsed / 1440)}d ago`);
			} else if (elapsed > 10080) {
				setElapsedTime(`${Math.floor(elapsed / 10080)}w ago`);
			}
		}, 60000);
		const tID = setTimeout(() => {
			Cancel();
		}, time || 10000);
		return () => {
			clearInterval(int);
			clearTimeout(tID);
		};
	});
	const OK = () => {
		setTimeout(() => {
			remove();
			if (onOk) onOk(inputValue());
		}, 200);
	};
	const Cancel = () => {
		setTimeout(() => {
			remove();
			notificationCount += 1;
			window.dispatchEvent(
				new CustomEvent("notification-count", {
					detail: { count: notificationCount },
				}),
			);
			SaveNotification({ iconSrc, application, message, onOk });
			if (onCancel) onCancel();
		}, 200);
	};
	const onDown = (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			OK();
		}
	};
	return (
		<div class={"flex flex-col shadow-tb-border-shadow bg-[#00000088] rounded-lg backdrop-blur-lg fade-in"}>
			<div class="flex justify-between items-center p-2 bg-[#ffffff20] rounded-t-lg">
				<div class="flex gap-2 items-center">
					<img class="size-6" src={iconSrc || "/assets/img/logo.png"} alt={application} />
					<div>{application || "Unknown App"}</div>
				</div>
				<div class="font-semibold text-[#ffffffa0] text-sm">{elapsedTime()}</div>
			</div>
			<div class="flex flex-col gap-2 p-2.5">
				<div class="text-lg font-semibold">{message}</div>
				<input type="text" value={inputValue()} onChange={e => setInputValue(e.currentTarget.value)} onKeyDown={onDown} class="w-full p-2 rounded-md leading-none text-lg bg-[#ffffff20] shadow-tb-border-shadow cursor-[var(--cursor-text)] focus-within:outline-hidden" />
				<div class="flex gap-2 justify-between">
					<button type="button" class="leading-none p-2.5 px-4 bg-[#ffffff20] shadow-tb-border rounded-md hover:bg-[#ffffff30] duration-150 cursor-pointer" onClick={Cancel}>
						Cancel
					</button>
					<button type="button" class="leading-none p-2.5 px-4 bg-[#53f67463] shadow-tb-border rounded-md hover:bg-[#53f67473] duration-150 cursor-pointer" onClick={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Toast({ iconSrc, application, message, time, onOk, onCancel, remove }: NotificationProps & { remove: () => void }) {
	const [elapsedTime, setElapsedTime] = createSignal<string>("Now");
	onMount(() => {
		const startTime = Date.now();
		const int = setInterval(() => {
			const elapsed = Math.floor((Date.now() - startTime) / 60000);
			if (elapsed > 0) {
				setElapsedTime(`${elapsed}min ago`);
			} else if (elapsed > 60) {
				setElapsedTime(`${Math.floor(elapsed / 60)}h ago`);
			} else if (elapsed > 1440) {
				setElapsedTime(`${Math.floor(elapsed / 1440)}d ago`);
			} else if (elapsed > 10080) {
				setElapsedTime(`${Math.floor(elapsed / 10080)}w ago`);
			}
		}, 60000);
		const tID = setTimeout(() => {
			Cancel();
		}, time || 10000);
		return () => {
			clearInterval(int);
			clearTimeout(tID);
		};
	});
	const Cancel = () => {
		setTimeout(() => {
			remove();
			notificationCount += 1;
			window.dispatchEvent(
				new CustomEvent("notification-count", {
					detail: { count: notificationCount },
				}),
			);
			SaveNotification({ iconSrc, application, message, onOk });
			if (onCancel) onCancel();
		}, 200);
	};
	const OK = () => {
		setTimeout(() => {
			remove();
			if (onOk) onOk();
		}, 200);
	};
	return (
		<div class={"flex flex-col shadow-tb-border-shadow bg-[#00000088] rounded-lg backdrop-blur-lg fade-in"}>
			<div class="flex justify-between items-center p-2 bg-[#ffffff20] rounded-t-lg">
				<div class="flex gap-2 items-center">
					<img class="size-6" src={iconSrc || "/assets/img/logo.png"} alt={application} />
					<div>{application || "Unkown App"}</div>
				</div>
				<div class="font-semibold text-[#ffffffa0] text-sm">{elapsedTime()}</div>
			</div>
			<div class="flex flex-col gap-2 p-2.5">
				<div class="text-lg font-semibold">{message}</div>
				<div class="flex gap-2 justify-between">
					<button type="button" class="leading-none p-2.5 px-4 bg-[#ffffff20] shadow-tb-border rounded-md hover:bg-[#ffffff30] duration-150 cursor-pointer" onClick={Cancel}>
						Cancel
					</button>
					<button type="button" class="leading-none p-2.5 px-4 bg-[#53f67463] shadow-tb-border rounded-md hover:bg-[#53f67473] duration-150 cursor-pointer" onClick={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export function Installing({ iconSrc, application, message, time, onOk, remove }: NotificationProps & { remove: () => void }) {
	const [currentAnimation, setCurrentAnimation] = createSignal<number>(0);

	onMount(() => {
		const tID = setTimeout(() => {
			OK();
		}, time || 10000);
		return () => {
			clearTimeout(tID);
		};
	});

	const anim0 = "anim0 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite";
	const anim1 = "anim1 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite";

	onMount(() => {
		const int = setInterval(() => {
			setCurrentAnimation(prev => (prev === 0 ? 1 : 0));
		}, 2100);
		return () => clearInterval(int);
	});

	const OK = () => {
		setTimeout(() => {
			remove();
			if (onOk) onOk();
		}, 200);
	};
	return (
		<div class={"flex flex-col shadow-tb-border-shadow bg-[#00000088] rounded-lg backdrop-blur-lg fade-in"}>
			<div class="flex items-center gap-2 p-2 bg-[#ffffff20] rounded-t-lg">
				<img src={iconSrc || "/assets/img/logo.png"} alt="Icon" style={{ width: "25px", height: "25px" }} />
				<div class="notification-application">{application || "com.tb.genericapp"}</div>
			</div>
			<div class="flex flex-col gap-2 p-2.5">
				<div class="text-lg font-semibold">{message}</div>
				<div class="relative flex w-full h-3 rounded-full bg-[#00000020] overflow-hidden">{currentAnimation() === 0 ? <div class="absolute h-full bg-[#50bf66] rounded-full" style={{ animation: anim0 }} /> : <div class="absolute h-full bg-[#50bf66] rounded-full" style={{ animation: anim1 }} />}</div>
				<div class="flex gap-2 justify-between">
					<button type="button" class="leading-none p-2.5 px-4 bg-[#53f67463] shadow-tb-border rounded-md hover:bg-[#53f67473] duration-150 cursor-pointer" style={{ position: "sticky", left: "100%" }} onClick={OK}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}

export async function SaveNotification({ iconSrc, application, message, onOk }: NotificationProps) {
	const notifications = JSON.parse(sessionStorage.getItem("notifications") || "[]");
	if (onOk) {
		const notificationObject = {
			message: message,
			icon: iconSrc || "/assets/img/logo.png",
			application: application || "com.tb.genericapp",
			time: new Date().toISOString(),
			onOk: {
				code: await onOk.toString(),
			},
		};
		console.log(notificationObject);
		notifications.push(notificationObject);
		sessionStorage.setItem("notifications", JSON.stringify(notifications));
		window.dispatchEvent(new CustomEvent("notification-update"));
	} else {
		const notificationObject = {
			message: message,
			icon: iconSrc || "/assets/img/logo.png",
			application: application || "com.tb.genericapp",
			time: new Date().toISOString(),
		};
		notifications.push(notificationObject);
		sessionStorage.setItem("notifications", JSON.stringify(notifications));
		window.dispatchEvent(new CustomEvent("notification-update"));
	}
}
