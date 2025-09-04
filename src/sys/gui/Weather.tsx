import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import getTime from "../apis/Time";
import type { SysSettings } from "../types";

interface LocationData {
	properties: {
		forecast: string;
	};
}
interface ForecastData {
	properties: {
		periods: Period[];
	};
}
interface WeatherData {
	temp: number;
	unit: string;
	icn: string;
}
interface Period {
	temperature: number;
	shortForecast: string;
}

export default function Weather() {
	const [weatherData, setWeatherData] = createSignal<WeatherData | null>(null);
	const [error, setError] = createSignal<Error | null>(null);

	createEffect(() => {
		const getWeather = async () => {
			try {
				const settings: SysSettings = JSON.parse(await Filer.fs.promises.readFile("/system/etc/terbium/settings.json"));
				const defaultLocation = "40.7590322,-74.0516312";
				const loc = settings.location || defaultLocation;
				const locationResponse = await fetch(`https://api.weather.gov/points/${loc}`, {
					method: "GET",
					headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0 Safari/537.36 Terbium-Browser/2.0.0",
					},
				});
				if (!locationResponse.ok) throw new Error("Failed to fetch location data");
				const locationData: LocationData = await locationResponse.json();

				const forecastResponse = await fetch(locationData.properties.forecast, {
					method: "GET",
					headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0 Safari/537.36 Terbium-Browser/2.0.0",
					},
				});
				if (!forecastResponse.ok) throw new Error("Failed to fetch forecast data");
				const forecastData: ForecastData = await forecastResponse.json();

				const currentPeriod = forecastData.properties.periods[0];
				let temp = currentPeriod.temperature;
				let unit = "°F";
				if (settings.weather) {
					const { unit: userUnit } = settings.weather;
					({ temp, unit } = formatTemp(temp, userUnit));
				}
				const icn = getIcon(currentPeriod.shortForecast);
				setWeatherData({ temp, unit, icn });
				setError(null);
			} catch (err: any) {
				setError(err);
				console.error("Failed to get weather", err);
			}
		};

		getWeather();
		window.addEventListener("updWeather", getWeather);
		onCleanup(() => window.removeEventListener("updWeather", getWeather));
	});

	return (
		<Show when={weatherData() && !error()} fallback={<div>Loading...</div>}>
			<div class="flex flex-row gap-1">
				<img src={weatherData()?.icn} class="w-6 h-6" />
				<div class="weather_temp">
					{weatherData()?.temp}
					{weatherData()?.unit}
				</div>
			</div>
		</Show>
	);
}

function formatTemp(temp: number, unit: string): { temp: number; unit: string } {
	switch (unit) {
		case "Celsius":
			return { temp: Math.round(((temp - 32) * 5) / 9), unit: "°C" };
		case "Kelvin":
			return { temp: Math.round(((temp - 32) * 5) / 9 + 273.15), unit: " K" };
		default:
			return { temp, unit: "°F" };
	}
}

function getIcon(sky: string): string {
	const time = getTime();
	const [timePart, period] = time.split(" ");
	const [hours] = timePart.split(":").map(Number);
	const hour24 = period === "PM" && hours !== 12 ? hours + 12 : period === "AM" && hours === 12 ? 0 : hours;
	let icn = "/assets/img/day.svg";
	if (sky === "Sunny" || sky === "Clear" || sky === "Mostly Clear") {
		icn = hour24 >= 18 ? "/assets/img/night.svg" : "/assets/img/day.svg";
	} else if (sky.includes("Partly")) {
		icn = hour24 >= 18 ? "/assets/img/cloudy_night.svg" : "/assets/img/cloudy_day.svg";
	} else if (sky.includes("Cloudy")) {
		icn = "/assets/img/cloudy.svg";
	} else if (sky.includes("Rain")) {
		icn = "/assets/img/rainy.svg";
	} else if (sky.includes("Snow") || sky.includes("Hail")) {
		icn = "/assets/img/snowy.svg";
	}
	return icn;
}
