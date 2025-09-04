import { createEffect, createSignal, onCleanup } from "solid-js";
import Mediaisland from "../apis/Mediaisland";
import AppIsland from "./AppIsland";
import Battery from "./Battery";
import NotificationCenter from "./NotificationCenter";
import Power from "./Power";
import "./styles/shell.css";
import Weather from "./Weather";
import Wifi from "./Wifi";

const Shell = () => {
	const [time, setTime] = createSignal<string>("");

	createEffect(() => {
		const update_time = () => {
			const now = new Date();
			setTime(
				now.toLocaleTimeString(navigator.language, {
					hour: "numeric",
					minute: "numeric",
					hour12: true,
				}),
			);
		};

		const interval = setInterval(update_time, 100);
		update_time();

		onCleanup(() => clearInterval(interval));
	});

	return (
		<div class="shell flex z-100 w-full gap-[6px] text-[#5f5f5f] px-1.5 py-0.5 justify-between">
			<div class="islands_left relative flex gap-[6px] items-center">
				<AppIsland />
				<Mediaisland />
			</div>
			<div class="islands_right flex gap-[6px] items-center">
				<div class="island p-2.5 gap-[6px] rounded-lg select-none" style={{ "background-image": "url(/assets/img/grain.png)" }}>
					<div class="weather font-[700] cursor-default">
						<Weather />
					</div>
					<div class="time font-[700] cursor-default">{time()}</div>
				</div>
				<div class="island system_island gap-3 pl-2.5 pr-1.5 py-1.5 rounded-lg" style={{ "background-image": "url(/assets/img/grain.png)" }}>
					<Power />
					<Wifi />
					<NotificationCenter />
					<Battery />
					{/* Desktop */}
					<div class="show_desk bg-[#ffffff3e] h-[calc(48px-16px)] w-4 rounded-[5px] cursor-pointer" onClick={() => window.dispatchEvent(new Event("min-wins"))} />
				</div>
			</div>
		</div>
	);
};

export default Shell;
