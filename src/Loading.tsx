import type { Component } from "solid-js";
import "./sys/gui/styles/loader.css";

const Loader: Component = () => {
	return (
		<div class="bg-[#0e0e0e] h-full justify-center items-center flex flex-col lg:h-full md:h-full">
			<img src="/tb.svg" alt="Terbium" class="w-[25%] h-[25%] breathe" />
			<div class="duration-150 flex flex-col justify-center items-center">
				<div class="text-container relative flex flex-col justify-center items-end">
					<div class="bg-linear-to-b from-[#ffffff] to-[#ffffff77] text-transparent bg-clip-text flex flex-col lg:items-center md:items-center sm:items-center">
						<span class="font-[700] lg:text-[34px] md:text-[28px] sm:text-[22px] text-right duration-150">
							<span class="font-[1000] duration-150">TerbiumOS</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Loader;
