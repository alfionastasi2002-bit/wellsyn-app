# Wellsyn – Your wellness. Connected.

Web application per la gestione integrata di benessere, alimentazione e allenamento.
Tre profili: **Cliente**, **Nutrizionista** e **Personal Trainer**, ognuno con la propria dashboard.
I professionisti lavorano in modo indipendente; il cliente decide se condividere con il team
i dati raccolti dagli altri professionisti.

## Tecnologie

| Parte | Tecnologia |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS, React Router, Recharts |
| Backend | Node.js + Express 5 (API REST in `/api`) |
| Database | MongoDB (Atlas) con Mongoose |
| Accesso | JWT in cookie `httpOnly`, password cifrate con bcrypt, permessi per ruolo |
| Hosting | Vercel (sito statico + funzione serverless per le API) |

## Struttura delle cartelle

```
Wellsyn/
├── api/index.js          # ingresso delle API su Vercel (usa l'app Express)
├── client/               # frontend React
│   ├── public/           # logo, icone, immagini
│   └── src/
│       ├── components/   # pezzi riutilizzabili (card, grafici, menu…)
│       ├── context/      # sessione utente (login/logout)
│       ├── lib/          # chiamate alle API e formattazione date/numeri
│       ├── pages/        # pagine: login, dashboard dei 3 ruoli, clienti, professionisti
│       └── navigation.js # voci del menu per ogni ruolo
├── server/               # backend Express
│   └── src/
│       ├── models/       # struttura dei dati su MongoDB
│       ├── routes/       # API (auth, dashboard, clienti, team, azioni del cliente)
│       ├── middleware/   # controllo login/ruoli e gestione errori
│       └── seed/         # dati dimostrativi
├── vercel.json           # configurazione di Vercel
└── .env.example          # modello delle variabili d'ambiente
```

## Comandi

Da eseguire nella cartella del progetto:

```bash
npm install          # installa le librerie (solo la prima volta o dopo un aggiornamento)
npm run dev          # sito (http://localhost:5173) + API con database di PROVA (dati demo, si azzera)
npm run dev:online   # come sopra ma sul database ONLINE di .env: le modifiche si vedono sul sito
npm run build        # crea la versione di produzione del sito
npm run seed         # carica i dati demo sul database di .env (solo se è vuoto)
```

`npm run dev` non tocca mai i dati online: è il modo sicuro per provare le modifiche.
Usa `npm run dev:online` solo quando vuoi lavorare consapevolmente sui dati reali.

## Account demo

Disponibili con i dati demo (database temporaneo o dopo `npm run seed`). Password per tutti: `Wellsyn2026!`

| Profilo | Email |
|---|---|
| Cliente | `giulia.rossi@wellsyn.demo` |
| Nutrizionista | `elena.bianchi@wellsyn.demo` |
| Personal Trainer | `luca.ferrari@wellsyn.demo` |

Altri clienti demo: `marco.bianchi@`, `martina.conti@`, `andrea.greco@`, `sara.conti@`, `davide.esposito@`,
`elena.romano@`, `chiara.moretti@` (tutti `…wellsyn.demo`).
**Nota:** prima di usare l'app con clienti veri, cancella i dati demo dal database di produzione.

## API principali

| Metodo | Percorso | Chi | Cosa fa |
|---|---|---|---|
| GET | `/api/health` | tutti | stato del server e del database |
| POST | `/api/auth/register` · `/login` · `/logout` | tutti | registrazione e accesso |
| GET | `/api/auth/me` | autenticati | utente collegato |
| GET | `/api/dashboard/client` · `/nutritionist` · `/trainer` | ruolo corrispondente | dati delle dashboard |
| PUT | `/api/me/workouts/today` · `/api/me/meals/today` | cliente | segna allenamento / pasti di oggi |
| GET/POST/DELETE | `/api/clients` | professionisti | elenco, aggiunta e rimozione clienti |
| GET | `/api/clients/:id/progress` | professionisti | misure e allenamenti visibili (in base al consenso) |
| GET/PATCH | `/api/team` | cliente | accetta professionisti e gestisce la condivisione |
| GET/POST/PUT/PATCH/DELETE | `/api/meal-plans` | nutrizionista | piani alimentari |
| GET/POST/PUT/PATCH/DELETE | `/api/workout-plans` | personal trainer | schede di allenamento |
| GET/POST/DELETE | `/api/checkins` | professionisti | controlli e misurazioni |
| GET/POST/PATCH | `/api/appointments` | tutti (crea solo il professionista) | agenda di controlli e sessioni |
| GET/POST | `/api/messages` | tutti | conversazioni tra cliente, professionisti e colleghi |
| GET/POST/DELETE | `/api/me/meal-plan` · `/workout-plan` · `/checkins` | cliente | le sue pagine e le pesate |
| PATCH · PUT | `/api/auth/me` · `/api/auth/password` | autenticati | profilo e cambio password |

## Stato del progetto

**Pronto:**
- login e registrazione con ruoli, dashboard di Cliente / Nutrizionista / Personal Trainer;
- cliente: alimentazione giorno per giorno, allenamenti e scheda, progressi con pesate, controlli, messaggi;
- nutrizionista: editor dei piani alimentari, agenda e misurazioni, progressi dei clienti, attività fisica condivisa;
- personal trainer: editor delle schede, agenda delle sessioni, progressi, check nutrizionali condivisi;
- gestione clienti, richieste di collegamento e consenso alla condivisione;
- messaggi (aggiornati ogni pochi secondi), impostazioni del profilo e password, centro assistenza, ricerca rapida;
- layout responsive per computer, tablet e smartphone.

**Prossimi passi possibili:** recupero password via email, notifiche email/push, foto profilo,
esportazione PDF di piani e schede, informativa privacy e consensi GDPR
(i dati sanitari sono "categorie particolari").
