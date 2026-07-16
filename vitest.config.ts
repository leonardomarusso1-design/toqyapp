import { defineConfig } from "vitest/config";
import path from "node:path";

// Resolve o mesmo alias @/* -> ./src/* que o Next.js já resolve nativamente
// (ver tsconfig.json paths) — sem isso, qualquer arquivo testado que
// importe via @/ (convenção usada em todo o projeto) quebra no vitest.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
