import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@next/next/no-img-element": "off",
      // Quality gate (skill eslint-quality-gates, 2026-09-06): nasce em "warn"
      // com a contagem real de violações documentada abaixo, nunca em "error"
      // direto — subir pra "error" só quando a contagem chegar a 0. Ver skill
      // file-size-refactor pra técnica de corte quando precisar reduzir um
      // arquivo específico.
      //
      // Baseline em 2026-09-06 (npm run lint): 6 arquivos acima de 350 linhas
      // — qr/page.tsx, onboarding/page.tsx, app/page.tsx (home),
      // PublicBioSite.tsx, SiteBuilder.tsx, segmentTemplates.ts. Os 2 últimos
      // são os maiores (962 e 1183 linhas) e os melhores candidatos pra
      // aplicar a skill file-size-refactor primeiro.
      "max-lines": ["warn", { max: 350, skipBlankLines: true, skipComments: true }],
    }
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
