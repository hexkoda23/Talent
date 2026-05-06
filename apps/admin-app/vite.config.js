import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
export default defineConfig({
    server: {
        host: "::",
        port: 5174,
        hmr: {
            overlay: false
        },
        proxy: {
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
                secure: false
            }
        }
    },
    plugins: [react()]
});
