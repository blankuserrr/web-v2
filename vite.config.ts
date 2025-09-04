import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
// @ts-expect-error no types
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
// @ts-expect-error no types
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import tailwindcss from "@tailwindcss/vite";
import config from "dotenv";
config.config();

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		solidPlugin(),
		tailwindcss(),
		viteStaticCopy({
			targets: [
				{
					src: `${baremuxPath}/**/*`.replace(/\\/g, "/"),
					dest: "baremux",
					overwrite: false,
				},
				{
					src: `${epoxyPath}/**/*`.replace(/\\/g, "/"),
					dest: "epoxy",
					overwrite: false,
				},
				{
					src: `${libcurlPath}/**/*`.replace(/\\/g, "/"),
					dest: "libcurl",
					overwrite: false,
				},
			],
		}),
		{
			name: "vite-wisp-server",
			configureServer(server) {
				server.httpServer?.on("upgrade", (req, socket, head) => (req.url?.startsWith("/wisp") ? wisp.routeRequest(req, socket, head) : undefined));
			},
		},
	],
	server: {
		port: process.env.port || 3001,
		watch: {
			ignored: ["**/public/apps/terminal.tapp/scripts/**"],
		},
	},
});
