import { createEffect, createSignal, onMount } from "solid-js";
import "../gui/styles/mediaisland.css";
import type { MediaProps } from "../types";

export let setMusicFn: (props: MediaProps) => void;
export let setVideoFn: (props: MediaProps) => void;
export let hideFn: () => void;
export let isExistingFn: () => void;

export default function MediaIsland() {
	const [mediaType, setMediaType] = createSignal<"music" | "video" | null>(null);
	const [mediaProps, setMediaProps] = createSignal<MediaProps | {}>({});
	const removeMedia = () => {
		setMediaType(null);
		setMediaProps({});
	};
	const setMusic = (props: MediaProps) => {
		setMediaType("music");
		setMediaProps(props);
	};
	const setVideo = (props: MediaProps) => {
		setMediaType("video");
		setMediaProps(props);
	};
	/**
	 * @returns Components for COM
	 * @author XSTARS
	 */
	onMount(() => {
		setMusicFn = setMusic;
		setVideoFn = setVideo;
		hideFn = removeMedia;
		isExistingFn = () => {
			window.dispatchEvent(new CustomEvent("isExistingMP", { detail: mediaType() !== null }));
		};
	});
	return (
		<div class={`island media_island w-[250px] h-[50px] rounded-lg ${mediaType() ? "opacity-100" : "opacity-0"}`} style={{ "background-image": `url(${(mediaProps() as MediaProps).background})`, "background-size": "cover", "background-position": "center", "background-repeat": "no-repeat" }}>
			{mediaType() === "music" && <Music {...(mediaProps() as MediaProps)} onRemove={removeMedia} />}
			{mediaType() === "video" && <Video {...(mediaProps() as MediaProps)} onRemove={removeMedia} />}
		</div>
	);
}

function Music({ track_name, artist, endtime, onRemove, onPausePlay, onNext, onBack }: MediaProps & { onRemove: () => void }) {
	const [isPaused, setIsPaused] = createSignal(false);
	const [elapsedTime, setElapsedTime] = createSignal(0);
	const [intervalId, setIntervalId] = createSignal<NodeJS.Timeout | null>(null);
	const [track, setTrack] = createSignal(track_name);
	createEffect(() => {
		if (isPaused()) {
			const currentIntervalId = intervalId();
			if (currentIntervalId) {
				clearInterval(currentIntervalId);
				setIntervalId(null);
			}
			return;
		}
		const id = setInterval(() => {
			setElapsedTime(prev => {
				if (prev + 1 >= endtime) {
					clearInterval(id);
					onRemove();
					return prev;
				}
				return prev + 1;
			});
		}, 1000);
		setIntervalId(id);
		return () => {
			if (id) clearInterval(id);
		};
	});
	onMount(() => {
		window.addEventListener("tb-pause-isl", () => PausePlay);
		return () => window.removeEventListener("tb-pause-isl", () => PausePlay);
	});
	const PausePlay = () => {
		setIsPaused(prev => !prev);
		// @ts-expect-error
		if (onPausePlay) {
			// @ts-expect-error
			onPausePlay();
		}
	};
	const next = () => {
		if (onNext) {
			// @ts-expect-error
			onNext();
		} else {
			onRemove();
		}
	};
	const back = () => {
		if (onBack) {
			// @ts-expect-error
			onBack();
		} else {
			onRemove();
		}
	};
	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = time % 60;
		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	};
	createEffect(() => {
		if (track().length > 21) {
			setTrack(`${track().slice(0, 21)}...`);
		}
	});
	return (
		<div class="music-player w-[250px] h-[50px]">
			<div class="info">
				<h1 class="track cursor-[var(--cursor-text)]">{track()}</h1>
				<h2 class="artist cursor-[var(--cursor-text)]">{artist}</h2>
			</div>
			<div class="playerctrl gap-2">
				<svg
					width="16"
					height="9"
					onClick={() => {
						next();
					}}
					class="back cursor-pointer"
					viewBox="0 0 16 9"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M6.25233 8.81131C7.22283 9.35152 8.43012 8.66736 8.43012 7.57709V5.80418L13.8222 8.81055C14.7927 9.35152 16 8.66811 16 7.57709V1.42267C16 0.331653 14.7927 -0.35175 13.8222 0.189215L8.43012 3.1971V1.42419C8.43012 0.333168 7.22283 -0.350992 6.25233 0.189972L0.733696 3.26756C-0.244565 3.81307 -0.244565 5.18897 0.733696 5.73448L6.25233 8.81131Z"
						fill="#A4A4A4"
					/>
				</svg>
				{isPaused() ? (
					<svg width="14" height="15" onClick={PausePlay} class="pauseplay cursor-pointer" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M0 1.71209C0 0.411806 1.39998 -0.412497 2.5445 0.213937L13.1107 6.0023C14.2964 6.65153 14.2964 8.34847 13.1107 8.9977L2.54541 14.7861C1.40089 15.4125 0.00091555 14.5882 0.00091555 13.2879L0 1.71209Z" fill="#DFDFDF" />
					</svg>
				) : (
					<svg width="14" height="15" onClick={PausePlay} class="pauseplay cursor-pointer" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect width="5.25" height="15" rx="2.625" fill="#DFDFDF" />
						<rect x="8.75" width="5.25" height="15" rx="2.625" fill="#DFDFDF" />
					</svg>
				)}
				<svg
					width="16"
					height="9"
					onClick={() => {
						back();
					}}
					class="forward cursor-pointer"
					viewBox="0 0 16 9"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M2.17779 0.189122C1.2073 -0.351863 0 0.332324 0 1.42263V7.57727C0 8.66834 1.2073 9.35176 2.17779 8.81078L7.56988 5.8043V7.57727C7.56988 8.66834 8.77717 9.35176 9.74767 8.81078L15.2663 5.73383C16.2446 5.1883 16.2446 3.81235 15.2663 3.26682L9.74767 0.189122C8.77717 -0.351863 7.56988 0.333081 7.56988 1.42263V3.1956L2.17779 0.189122Z"
						fill="#A4A4A4"
					/>
				</svg>
			</div>
			<div class="seekbar">
				<h4 id="currenttime">{formatTime(elapsedTime())}</h4>
				<div class="bar" />
				<h4 id="endtime">{formatTime(endtime)}</h4>
			</div>
		</div>
	);
}

function Video({ video_name, creator, endtime, onRemove, onPausePlay, onBack, onNext }: MediaProps & { onRemove: () => void }) {
	const [isPaused, setIsPaused] = createSignal(false);
	const [elapsedTime, setElapsedTime] = createSignal(0);
	const [intervalId, setIntervalId] = createSignal<NodeJS.Timeout | null>(null);
	const [video, setVideo] = createSignal(video_name);
	createEffect(() => {
		if (isPaused()) {
			const currentIntervalId = intervalId();
			if (currentIntervalId) {
				clearInterval(currentIntervalId);
				setIntervalId(null);
			}
			return;
		}
		const id = setInterval(() => {
			setElapsedTime(prev => {
				if (prev + 1 >= endtime) {
					clearInterval(id);
					onRemove();
					return prev;
				}
				return prev + 1;
			});
		}, 1000);
		setIntervalId(id);
		return () => {
			if (id) clearInterval(id);
		};
	});
	onMount(() => {
		window.addEventListener("tb-pause-isl", () => PausePlay);
		return () => window.removeEventListener("tb-pause-isl", () => PausePlay);
	});
	const PausePlay = () => {
		setIsPaused(prev => !prev);
		// @ts-expect-error
		onPausePlay();
	};
	const next = () => {
		if (onNext) {
			// @ts-expect-error
			onNext();
		} else {
			onRemove();
		}
	};
	const back = () => {
		if (onBack) {
			// @ts-expect-error
			onBack();
		} else {
			onRemove();
		}
	};
	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = time % 60;
		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	};
	createEffect(() => {
		if (video().length > 21) {
			setVideo(`${video().slice(0, 21)}...`);
		}
	});
	return (
		<div class="music-player w-[250px] h-[50px]">
			<div class="info">
				<h1 class="track cursor-[var(--cursor-text)]">{video()}</h1>
				<h2 class="artist cursor-[var(--cursor-text)]">{creator}</h2>
			</div>
			<div class="playerctrl gap-2">
				<svg
					width="16"
					height="9"
					onClick={() => {
						next();
					}}
					class="back cursor-pointer"
					viewBox="0 0 16 9"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M6.25233 8.81131C7.22283 9.35152 8.43012 8.66736 8.43012 7.57709V5.80418L13.8222 8.81055C14.7927 9.35152 16 8.66811 16 7.57709V1.42267C16 0.331653 14.7927 -0.35175 13.8222 0.189215L8.43012 3.1971V1.42419C8.43012 0.333168 7.22283 -0.350992 6.25233 0.189972L0.733696 3.26756C-0.244565 3.81307 -0.244565 5.18897 0.733696 5.73448L6.25233 8.81131Z"
						fill="#A4A4A4"
					/>
				</svg>
				{isPaused() ? (
					<svg width="14" height="15" onClick={PausePlay} class="pauseplay cursor-pointer" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M0 1.71209C0 0.411806 1.39998 -0.412497 2.5445 0.213937L13.1107 6.0023C14.2964 6.65153 14.2964 8.34847 13.1107 8.9977L2.54541 14.7861C1.40089 15.4125 0.00091555 14.5882 0.00091555 13.2879L0 1.71209Z" fill="#DFDFDF" />
					</svg>
				) : (
					<svg width="14" height="15" onClick={PausePlay} class="pauseplay cursor-pointer" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect width="5.25" height="15" rx="2.625" fill="#DFDFDF" />
						<rect x="8.75" width="5.25" height="15" rx="2.625" fill="#DFDFDF" />
					</svg>
				)}
				<svg
					width="16"
					height="9"
					onClick={() => {
						back();
					}}
					class="forward cursor-pointer"
					viewBox="0 0 16 9"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M2.17779 0.189122C1.2073 -0.351863 0 0.332324 0 1.42263V7.57727C0 8.66834 1.2073 9.35176 2.17779 8.81078L7.56988 5.8043V7.57727C7.56988 8.66834 8.77717 9.35176 9.74767 8.81078L15.2663 5.73383C16.2446 5.1883 16.2446 3.81235 15.2663 3.26682L9.74767 0.189122C8.77717 -0.351863 7.56988 0.333081 7.56988 1.42263V3.1956L2.17779 0.189122Z"
						fill="#A4A4A4"
					/>
				</svg>
			</div>
			<div class="seekbar">
				<h4 id="currenttime">{formatTime(elapsedTime())}</h4>
				<div class="bar" />
				<h4 id="endtime">{formatTime(endtime)}</h4>
			</div>
		</div>
	);
}
