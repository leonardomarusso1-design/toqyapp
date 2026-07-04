import pkg from "../../package.json";

// VERCEL_GIT_COMMIT_SHA e injetada automaticamente pela Vercel em builds
// de producao/preview (nao precisa configurar nada) — em dev local cai no
// fallback "dev".
export const APP_VERSION = pkg.version;
export const BUILD_ID = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7);
