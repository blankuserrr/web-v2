import type { Component } from "solid-js";
import Api from "./sys/Api";
import Desktop from "./sys/gui/Desktop";

const App: Component = () => {
	Api();
	return (
		<Desktop
			desktop={1}
			onContextMenu={(e: MouseEvent) => {
				e.preventDefault();
			}}
		/>
	);
};

export default App;
