const navbuttons = document.querySelectorAll(".navbtn");

navbuttons.forEach(btn => {
	const tooltip = btn.querySelector("span");
	const btnWidth = btn.getBoundingClientRect().width;
	tooltip.classList.add(`top-[${btnWidth + 4}px]`);

	btn.addEventListener(
		"mouseover",
		() => {
			setTimeout(() => {
				if (btn.matches(":hover")) {
					tooltip.classList.remove("opacity-0");
					tooltip.classList.remove(`top-[${btnWidth + 4}px]`);
					tooltip.classList.add(`top-[${btnWidth + 14}px]`);
					btn.addEventListener("mouseleave", () => {
						tooltip.classList.add("opacity-0");
						tooltip.classList.remove(`top-[${btnWidth + 14}px]`);
						tooltip.classList.add(`top-[${btnWidth + 4}px]`);
					});
				}
			}, 1000);
		},
		"once",
	);
});

document.addEventListener("DOMContentLoaded", () => {
	getTasks();
	setInterval(getTasks, 1000);
});

function loadPane(val) {
	const sys = document.getElementById("sysinf");
	const main = document.getElementById("appl");
	if (val === "sys") {
		sys.classList.remove("opacity-0", "pointer-events-none");
		main.classList.add("opacity-0", "pointer-events-none");
		getSpecs();
	} else {
		main.classList.remove("opacity-0", "pointer-events-none");
		sys.classList.add("opacity-0", "pointer-events-none");
	}
}

function getSpecs() {
	const cputxt = document.getElementById("cpu");
	const memtxt = document.getElementById("ram");
	const ssdtxt = document.getElementById("ssd");
	const gputxt = document.getElementById("gpu");
	const mem = navigator.deviceMemory ? navigator.deviceMemory + "GB" + " of ram" : "Not Available";
	const canvas = document.createElement("canvas");
	const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	if (!gl) {
		console.error("%cGPU%c: Information not available", `color: ${accent}`, "color: #b6b6b6");
		return;
	}
	let gpuName;
	const dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
	if (dbgRenderInfo) {
		const rndr = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
		const regex = /ANGLE \(.+?,\s*(.+?) \(/;
		const match = rndr.match(regex);
		gpuName = match ? match[1] : "Not Available";
	}
	navigator.storage.estimate().then(estimate => {
		const totalSize = estimate.quota;
		const usedSize = estimate.usage;
		const usedPercentage = (usedSize / totalSize) * 100;
		let formattedUsedSize, formattedTotalSize;
		if (usedSize >= 1024 * 1024 * 1024) {
			formattedUsedSize = `${(usedSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
		} else {
			formattedUsedSize = `${(usedSize / (1024 * 1024)).toFixed(2)} MB`;
		}
		if (totalSize >= 1024 * 1024 * 1024) {
			formattedTotalSize = `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
		} else {
			formattedTotalSize = `${Math.round((totalSize / (1024 * 1024)).toFixed(2))} MB`;
		}
		ssdtxt.textContent = `${formattedUsedSize} of ${formattedTotalSize}`;
	});
	const cpuCors = navigator.hardwareConcurrency;
	cputxt.textContent = `${cpuCors} Logical Cores (${Math.floor(cpuCors / 2)} Cores ${cpuCors} threads)`;
	memtxt.textContent = mem;
	gputxt.textContent = gpuName;
}

function getTasks() {
	const windows = tb.process.list();
	const main = document.querySelector("tbody");
	const existingEntries = main.querySelectorAll("tr");
	const currentWinIds = Array.from(existingEntries).map(entry => entry.getAttribute("win-id"));
	const currentIdsSet = new Set(currentWinIds);
	Object.values(windows).forEach(window => {
		const winID = window.id;
		if (currentIdsSet.has(winID)) {
			currentIdsSet.delete(winID);
			return;
		}
		const tr = document.createElement("tr");
		tr.classList.add("hover:bg-[#ffffff18]", "duration-150", "ease-in-out", "px-2.5");
		tr.setAttribute("win-id", winID);

		const thName = document.createElement("th");
		thName.textContent = typeof window.name === "string" ? window.name : window.name.text;
		thName.classList.add("text-left", "py-2.5", "pl-3.5", "pr-[100px]");
		const tdMemory = document.createElement("td");
		tdMemory.textContent = "N/A";

		const tdPID = document.createElement("td");
		tdPID.textContent = window.pid;

		const tdState = document.createElement("td");
		const stateText = document.createElement("span");
		if (window.pid === tb.window.getId()) {
			stateText.textContent = "Active";
		} else {
			stateText.textContent = "Idle";
		}
		tdState.appendChild(stateText);

		const tdActions = document.createElement("td");
		const btnEnd = document.createElement("button");
		btnEnd.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>`;
		btnEnd.onclick = () => {
			tb.process.kill(window.pid);
		};

		tr.appendChild(thName);
		tr.appendChild(tdMemory);
		tr.appendChild(tdPID);
		tr.appendChild(tdState);
		tr.appendChild(tdActions);
		tdActions.appendChild(btnEnd);
		main.appendChild(tr);
	});
	existingEntries.forEach(entry => {
		const winID = entry.getAttribute("win-id");
		if (!Object.values(windows).some(window => window.id === winID)) {
			main.removeChild(entry);
		}
	});
}
