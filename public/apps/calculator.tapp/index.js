document.querySelectorAll(".cbtn").forEach(btn => {
	btn.addEventListener("click", () => {
		const display = document.querySelector(".eq");
		const value = btn.getAttribute("data-value");
		switch (value) {
			default: {
				const displayValue = display.value;
				const newValue = displayValue + value;
				if (display.value === "0") {
					if (value === ".") return;
					if (value === "0") return;
					if (value === "+") return;
					if (value === "-") return;
					if (value === "*") return;
					if (value === "/") return;
				}
				if (display.getAttribute("is-equal") === "true") {
					display.value = "";
					display.value = value;
					display.setAttribute("is-equal", "false");
				} else {
					if (display.value === "0") {
						display.value = value;
					} else {
						display.value = newValue;
					}
				}
				break;
			}
			case "clear":
				display.value = "0";
				display.setAttribute("is-equal", "false");
				break;
			case "del": {
				if (display.value.length === 1) {
					display.value = "0";
					display.setAttribute("is-equal", "false");
					break;
				}
				const delValue = display.value.slice(0, -1);
				display.value = delValue;
				display.setAttribute("is-equal", "false");
				break;
			}
			case "equal": {
				const eqValue = math.evaluate(display.value);
				display.value = eqValue;
				display.setAttribute("is-equal", "true");
				break;
			}
			case "np": {
				const npValue = display.value * -1;
				display.value = npValue;
				display.setAttribute("is-equal", "false");
				break;
			}
		}
	});
});

window.addEventListener("keydown", e => {
	const availableKeys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "+", "-", "*", "/", "%", "Backspace", "Enter"];
	if (availableKeys.includes(e.key)) {
		const display = document.querySelector(".eq");
		const value = e.key;
		switch (value) {
			default: {
				const displayValue = display.value;
				const newValue = displayValue + value;
				if (display.getAttribute("is-equal") == "true") {
					display.value = "";
					display.value = value;
					display.setAttribute("is-equal", "false");
				} else {
					if (display.value === "0") {
						console.log("zero");
						display.value = value;
					} else {
						display.value = newValue;
					}
				}
				break;
			}
			case "-":
				if (display.value === "0") return;
				display.value = display.value + value;
				if (display.getAttribute("is-equal") == "true") display.setAttribute("is-equal", "false");
				break;
			case "+":
				if (display.value === "0") return;
				display.value = display.value + value;
				if (display.getAttribute("is-equal") == "true") display.setAttribute("is-equal", "false");
				break;
			case "*":
				if (display.value === "0") return;
				display.value = display.value + value;
				if (display.getAttribute("is-equal") == "true") display.setAttribute("is-equal", "false");
				break;
			case "/":
				e.preventDefault();
				if (display.value === "0") return;
				display.value = display.value + value;
				if (display.getAttribute("is-equal") == "true") display.setAttribute("is-equal", "false");
				break;
			case "Backspace": {
				if (display.value.length === 1) {
					display.value = "0";
					display.setAttribute("is-equal", "false");
					break;
				}
				const delValue = display.value.slice(0, -1);
				display.value = delValue;
				display.setAttribute("is-equal", "false");
				break;
			}
			case "Enter": {
				e.preventDefault();
				const eqValue = math.evaluate(display.value);
				display.value = eqValue;
				display.setAttribute("is-equal", "true");
				break;
			}
		}
	}
});
