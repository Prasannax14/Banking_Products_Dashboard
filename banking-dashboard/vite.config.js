import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the build work on GitHub Pages or any static host.
export default defineConfig({ base: "./", plugins: [react()] });
