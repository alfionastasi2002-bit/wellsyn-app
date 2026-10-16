// Carica i dati demo sul database indicato in MONGODB_URI (es. MongoDB Atlas).
// Uso:  npm run seed            -> solo se il database è vuoto
//       npm run seed -- --reset -> cancella TUTTO e ricarica i dati demo
import mongoose from 'mongoose';
import { connectDB, describeDbError } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { seedDemoData } from './demo.js';

async function run() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI non impostata: inserisci la stringa di connessione nel file .env.');
  }
  await connectDB();

  const reset = process.argv.includes('--reset');
  const users = await User.countDocuments();
  if (users > 0 && !reset) {
    console.log(
      `Il database contiene già ${users} utenti: non tocco nulla.\n` +
        'Se vuoi cancellare tutto e ricaricare i dati demo usa:  npm run seed -- --reset',
    );
    return;
  }
  await seedDemoData();
}

run()
  .catch((err) => {
    console.error('✗ Seed non riuscito:', describeDbError(err) ?? err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
