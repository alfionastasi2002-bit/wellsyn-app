// Punto d'ingresso su Vercel: tutte le richieste /api/* arrivano qui
// (vedi "rewrites" in vercel.json) e vengono gestite dall'app Express.
import app from '../server/src/app.js';

export default app;
