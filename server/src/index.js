// Avvio del server in locale (sul tuo PC). Su Vercel si usa invece api/index.js.
//   npm run dev         -> database di PROVA in memoria con dati demo (sicuro: non tocca i dati online)
//   npm run dev:online  -> database ONLINE indicato in MONGODB_URI (le modifiche si vedono sul sito)
import app from './app.js';
import { connectDB, describeDbError } from './config/db.js';
import { env } from './config/env.js';

const useOnlineDatabase = process.argv.includes('--online');

async function startInMemoryDatabase() {
  console.log(
    '\nℹ  Database di PROVA sul tuo PC con dati demo: si azzera a ogni riavvio e non tocca i dati online.\n' +
      '   Per lavorare sul database online usa:  npm run dev:online\n',
  );
  const { MongoMemoryServer } = await import('mongodb-memory-server-core');
  const memoryServer = await MongoMemoryServer.create();
  await connectDB(memoryServer.getUri('wellsyn'));
  const { seedDemoData } = await import('./seed/demo.js');
  await seedDemoData();
}

async function start() {
  if (useOnlineDatabase) {
    if (!env.mongoUri) throw new Error('MONGODB_URI non configurata nel file .env.');
    await connectDB();
    console.warn('\n⚠  Collegato al database ONLINE: ogni modifica è visibile anche sul sito pubblicato.\n');
  } else {
    await startInMemoryDatabase();
  }
  app.listen(env.port, () => {
    console.log(`✓ API Wellsyn pronta su http://localhost:${env.port}/api/health`);
  });
}

start().catch((err) => {
  console.error('\n✗ Avvio non riuscito:', describeDbError(err) ?? err.message);
  process.exit(1);
});
