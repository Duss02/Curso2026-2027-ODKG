import { defineConfig } from 'vite';

// In sviluppo /sparql viene inoltrato all'endpoint del repository GraphDB "la311"
// (http://localhost:7200/repositories/la311), così il browser non deve gestire CORS.
// Per puntare a un altro server o repository: GRAPHDB_URL e GRAPHDB_REPO.
// In produzione si usa VITE_SPARQL_ENDPOINT (vedi src/config.ts).
const GRAPHDB_URL = process.env.GRAPHDB_URL ?? 'http://localhost:7200';
const GRAPHDB_REPO = process.env.GRAPHDB_REPO ?? 'la311';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/sparql': {
        target: GRAPHDB_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sparql/, `/repositories/${GRAPHDB_REPO}`),
      },
    },
  },
});
