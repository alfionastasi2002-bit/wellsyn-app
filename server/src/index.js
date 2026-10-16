// Avvio del server in locale (sul tuo PC). Su Vercel si usa invece api/index.js.
import app from './app.js';
import { connectDB, describeDbError } from './config/db.js';
import { env } from './config/env.js';

async function startInMemoryDatabase() {
  console.warn(
    '\n⚠  MONGODB_URI non impostata nel file .env: avvio un database temporaneo con dati demo.\n' +
      '   Tutto ciò che salvi verrà perso alla chiusura. Collega MongoDB Atlas per conservare i dati.\n',
  );
  const { MongoMemoryServer } = await import('mongodb-memory-server-core');
  const memoryServer = await MongoMemoryServer.create();
  await connectDB(memoryServer.getUri('wellsyn'));
  const { seedDemoData } = await import('./seed/demo.js');
  await seedDemoData();
}

async function start() {
  if (env.mongoUri) {
    await connectDB();
    console.log('✓ Collegato a MongoDB');
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
