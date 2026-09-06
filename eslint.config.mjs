import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importX from "eslint-plugin-import-x";

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
  {
    // Import boundary (skill eslint-quality-gates, 2026-09-06): trava o bug
    // de categoria "client component importa cliente Supabase privilegiado" —
    // src/lib/supabaseServer.ts usa a service-role key (bypassa RLS) e
    // src/lib/rateLimit.ts só faz sentido em rota de servidor. Zerado na
    // baseline (nenhum arquivo em src/components hoje importa nenhum dos
    // dois) — por isso já entra direto em "error", sem passar por "warn".
    plugins: { "import-x": importX },
    settings: {
      "import-x/resolver": { typescript: true },
    },
    rules: {
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/components",
              from: ["./src/lib/supabaseServer.ts", "./src/lib/rateLimit.ts"],
              message:
                "Componentes de UI (client) não podem importar cliente Supabase " +
                "com service-role key ou rate limiter de servidor — isso " +
                "vazaria credencial privilegiada pro bundle do navegador. " +
                "Exponha via API route (src/app/api/**) e chame por fetch.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
