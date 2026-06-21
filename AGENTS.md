# Diretrizes do Projeto

- **Arquitetura:** Este é um app Astro agnóstico à plataforma, mas com otimizações para Cloudflare Workers (adapter `@astrojs/cloudflare`).
- **Variáveis de Ambiente:**
  - Evite `process.env`.
  - Acesse bindings e variáveis via `this.env` dentro dos serviços, que abstrai `event.platform.env` / `locals.runtime.env`.
- **Serviços (Injeção de Dependência):**
  - Os serviços são inicializados no `src/middleware.ts` e injetados em `Astro.locals.services` / `context.locals.services`.
  - Cada serviço recebe um `AppEvent` (contexto mínimo da requisição) no construtor.
  - Toda comunicação entre serviços deve ser feita via `this.services.<nome_do_serviço>` (disponível via getter no `BaseService`).
- **Fetch & Cloudflare:**
  - Ao usar `fetch` com opções específicas da Cloudflare (ex: `cf: { cacheTtl: ... }`), use `// @ts-ignore` acima da propriedade `cf`. Isso mantém o código compatível com Astro padrão enquanto aproveita recursos da plataforma.
- **Stremio Protocol:**
  - Rotas em `src/pages/api/stremio` seguem o protocolo de addons do Stremio.
  - **CORS:** O cabeçalho `Access-Control-Allow-Origin: *` é obrigatório para compatibilidade com o player do Stremio.
  - **Manifesto:** O arquivo `src/pages/api/stremio/manifest.json.ts` define o catálogo e capacidades do addon.
- **Web Scraping:**
  - O projeto utiliza regex para extrair links de motores de busca.
  - Use as funções utilitárias em `src/lib/utils.ts` (`matchFirstGroup`, `htmlSanitize`) para manter a consistência na extração de dados.
- **Tipagem:**
  - Evite `any`. Prefira `unknown` com validação ou tipos explícitos para resultados de busca e links de torrent.
- **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
- **Healthcheck:** Cada serviço deve implementar seu próprio `healthCheck()` para validar integrações externas.

## Estrutura de Pastas

- **src/lib/server/services**: Lógica de negócio e integrações (IMDb, busca, torrents).
- **src/lib/server/app-event.ts**: Contexto mínimo da requisição (`AppEvent`) passado aos serviços.
- **src/lib/server/services/base**: Classe abstrata com getters para `services`, `env`, `locals` e `platform`.
- **src/pages/api/stremio**: Endpoints de integração com o protocolo Stremio.
- **src/layouts**: Layouts Astro compartilhados.
- **src/components**: Componentes Svelte (ilhas interativas) e utilitários de UI.
- **src/lib/utils.ts**: Utilitários para processamento de strings, regex e sanitização.
- **src/middleware.ts**: Inicialização de serviços e middleware Paraglide.
