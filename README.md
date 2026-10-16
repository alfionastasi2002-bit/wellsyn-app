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
npm run dev          # avvia sito (http://localhost:5173) e API (porta 5000)
npm run build        # crea la versione di produzione del sito
npm run seed         # carica i dati demo sul database di .env (solo se è vuoto)
```

Se nel file `.env` la variabile `MONGODB_URI` è vuota, `npm run dev` avvia un database temporaneo
in memoria già pieno di dati demo (si azzera a ogni riavvio).

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
| GET/PATCH | `/api/team` | cliente | accetta professionisti e gestisce la condivisione |

## Stato del progetto

**Pronto:** login e registrazione con ruoli, dashboard di Cliente / Nutrizionista / Personal Trainer
con dati reali, gestione clienti, richieste di collegamento e consenso alla condivisione, layout responsive.

**Prossimi passi:** editor dei piani alimentari e delle schede, registrazione dei controlli,
agenda appuntamenti, messaggistica, pagina profilo/impostazioni, recupero password via email,
informativa privacy e consensi GDPR (i dati sanitari sono "categorie particolari").
