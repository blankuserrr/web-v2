import { type Component, createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import "./styles/notification.css";

interface Notification {
	message: string;
	application: string;
	icon: string;
	onOk?: { code: string };
	time?: string;
}

export let totalNotifs: number;

export default function NotificationCenter() {
	const [notificationCount, setNotificationCount] = createSignal(0);
	let iconRef: HTMLImageElement | undefined;

	onMount(() => {
		try {
			const savedCount = JSON.parse(sessionStorage.getItem("notifications") || "[]").length;
			setNotificationCount(savedCount ? Number.parseInt(savedCount, 10) : 0);
		} catch (e) {
			console.error("Failed to parse notifications from session storage", e);
			setNotificationCount(0);
		}
	});

	createEffect(() => {
		const updateCount = (event: CustomEvent) => {
			setNotificationCount(event.detail.count);
		};
		window.addEventListener("notification-count", updateCount as EventListener);
		onCleanup(() => {
			window.removeEventListener("notification-count", updateCount as EventListener);
		});
	});

	createEffect(() => {
		totalNotifs = notificationCount();
	});

	const handleMouseEvent = (action: "add" | "remove") => {
		iconRef?.classList[action]("scale-90");
	};

	return (
		<img
			alt="notifimg"
			ref={iconRef}
			src={`/assets/img/notif_${notificationCount() > 9 ? "plus" : Math.max(0, Math.min(notificationCount(), 9))}.svg`}
			class="tooltip_item w-6 h-6 cursor-pointer duration-150 select-none"
			onMouseUp={() => {
				handleMouseEvent("remove");
				window.dispatchEvent(new Event("open-notif"));
			}}
			onMouseLeave={() => handleMouseEvent("remove")}
			onMouseOver={() => handleMouseEvent("add")}
			onMouseDown={() => handleMouseEvent("add")}
		/>
	);
}

interface INotificationProps {
	isOpen: boolean;
}

const NotificationMenu: Component<INotificationProps> = props => {
	const [notifications, setNotifications] = createSignal<Notification[]>([]);
	let notificationCenterRef: HTMLDivElement | undefined;

	const updateNotifications = () => {
		try {
			const notifs = JSON.parse(sessionStorage.getItem("notifications") || "[]");
			setNotifications(notifs);
		} catch (e) {
			console.error("Failed to update notifications from session storage", e);
		}
	};

	onMount(() => {
		updateNotifications();
		window.addEventListener("notification-update", updateNotifications as EventListener);
		onCleanup(() => {
			window.removeEventListener("notification-update", updateNotifications as EventListener);
		});
	});

	createEffect(() => {
		const leave = (e: MouseEvent) => {
			if (!notificationCenterRef) return;
			const rect = notificationCenterRef.getBoundingClientRect();
			const xBound = e.clientX >= rect.left - 5 && e.clientX <= rect.right + 5;
			const yBound = e.clientY >= rect.top - 5 && e.clientY <= rect.bottom + 5;
			const withinRadius = xBound && yBound;

			if (e.button === 0 && !notificationCenterRef.contains(e.target as Node) && !withinRadius) {
				setTimeout(() => {
					window.dispatchEvent(new Event("open-notif"));
				}, 150);
			}
		};

		if (props.isOpen) {
			document.addEventListener("mousedown", leave);
		} else {
			document.removeEventListener("mousedown", leave);
		}

		onCleanup(() => document.removeEventListener("mousedown", leave));
	});

	const dismiss = (index: number) => {
		const notifData = notifications().filter((_, i) => i !== index);
		setNotifications(notifData);
		if (totalNotifs > 0) {
			totalNotifs -= 1;
			window.dispatchEvent(
				new CustomEvent("notification-count", {
					detail: { count: totalNotifs },
				}),
			);
		}
		sessionStorage.setItem("notifications", JSON.stringify(notifData));
	};

	const calculateTimeAgo = (timeStr?: string) => {
		if (!timeStr) return "Now";
		const currentTime = Date.now();
		const timeDiff = currentTime - new Date(timeStr).getTime();
		if (timeDiff < 60000) return "Just now";
		if (timeDiff < 3600000) return `${Math.floor(timeDiff / 60000)}min ago`;
		if (timeDiff < 86400000) return `${Math.floor(timeDiff / 3600000)}h ago`;
		if (timeDiff < 604800000) return `${Math.floor(timeDiff / 86400000)}d ago`;
		return `${Math.floor(timeDiff / 604800000)}w ago`;
	};

	return (
		<div
			ref={notificationCenterRef}
			class="absolute top-[60px] right-1.5 flex flex-col w-[400px] h-max max-h-[calc(100%-calc(60px+1.5rem))] rounded-lg p-2.5 gap-2.5 bg-[#2020208c] shadow-tb-border-shadow backdrop-blur-[100px] text-white z-999 overflow-y-auto"
			classList={{
				"duration-200": props.isOpen,
				"opacity-0 pointer-events-none -translate-y-6 duration-300": !props.isOpen,
			}}
		>
			<h1 class="text-2xl font-bold text-[#ffffffe6]">Notifications</h1>
			<Show
				when={notifications().length > 0}
				fallback={
					<div class="justify-center items-center flex h-full font-[700] text-[20px] duration-700" classList={{ "": props.isOpen, "opacity-0 -translate-y-2": !props.isOpen }}>
						No Notifications yet.
					</div>
				}
			>
				<div
					class="flex flex-col gap-2.5 duration-700"
					classList={{
						"": props.isOpen,
						"opacity-0 -translate-y-2": !props.isOpen,
					}}
				>
					<For each={notifications()}>
						{(notification, index) => (
							<div class="flex flex-col bg-[#ffffff18] shadow-tb-border-shadow rounded-lg overflow-hidden">
								<div class="flex justify-between items-center bg-[#ffffff20] p-2.5">
									<div class="flex gap-2 items-center">
										<img src={notification.icon} alt="Icon" style={{ width: "25px", height: "25px" }} />
										<div class="notification-application">{notification.application}</div>
									</div>
									<Show when={notification.time}>
										<div class="font-semibold text-[#ffffffa0] text-sm">{calculateTimeAgo(notification.time)}</div>
									</Show>
								</div>
								<div class="flex flex-col gap-2 p-2.5">
									<div class="text-lg font-semibold">{notification.message}</div>
									<div class="flex gap-2 justify-between">
										<button type="button" class="leading-none p-2.5 cursor-pointer px-4 bg-[#ffffff20] shadow-tb-border rounded-md hover:bg-[#ffffff30] duration-150" onClick={() => dismiss(index())}>
											Dismiss
										</button>
										<button
											type="button"
											class="leading-none p-2.5 cursor-pointer px-4 bg-[#53f67463] shadow-tb-border rounded-md hover:bg-[#53f67473] duration-150"
											onClick={async () => {
												if (notification.onOk) {
													try {
														const onOk = new Function(`return ${notification.onOk.code}`)();
														await onOk();
													} catch (error) {
														console.error(error);
													}
												}
												dismiss(index());
											}}
										>
											Open
										</button>
									</div>
								</div>
							</div>
						)}
					</For>
				</div>
			</Show>
		</div>
	);
};

export { NotificationMenu };
