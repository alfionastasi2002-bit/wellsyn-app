import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { connectDB, describeDbError } from './config/db.js';
import { errorHandler, notFound } from './middleware/errors.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import authRoutes from './routes/auth.routes.js';
import checkinsRoutes from './routes/checkins.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import mealPlansRoutes from './routes/mealPlans.routes.js';
import meRoutes from './routes/me.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import teamRoutes from './routes/team.routes.js';
import workoutPlansRoutes from './routes/workoutPlans.routes.js';

const app = express();

app.set('trust proxy', 1); // su Vercel le richieste passano da un proxy
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Controllo rapido: apri /api/health per sapere se il server vede il database.
app.get('/api/health', async (_req, res) => {
  try {
    await connectDB();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', hint: describeDbError(err) ?? err.message });
  }
});

// Tutte le altre API hanno bisogno del database.
app.use('/api', async (_req, _res, next) => {
  await connectDB();
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/me', meRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/meal-plans', mealPlansRoutes);
app.use('/api/workout-plans', workoutPlansRoutes);
app.use('/api/checkins', checkinsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/messages', messagesRoutes);

app.use('/api', notFound);
app.use(errorHandler);

export default app;
