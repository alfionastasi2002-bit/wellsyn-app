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
├── shared/foods.js       # libreria di alimenti e ricette (usata dall'editor e dai dati demo)
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

Con `npm run dev` (database di prova sul tuo PC) vengono creati anche **30 clienti demo in più**,
con controlli, piani, schede, allenamenti e appuntamenti, per vedere l'app con tanti clienti
(es. `alessandro.costa@wellsyn.demo`, stessa password). Il comando `npm run seed` per il database online non li aggiunge.
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
| GET | `/api/clients/overview` | professionisti | riepilogo per le liste clienti (peso, allenamenti, check: in base al consenso) |
| GET | `/api/clients/:id/progress` | professionisti | misure e allenamenti visibili (in base al consenso) |
| GET | `/api/clients/:id/profile` | professionisti | dati del cliente per preparare un piano (età, altezza, ultimo peso, preferenze) |
| GET/PATCH | `/api/team` | cliente | accetta professionisti e gestisce la condivisione |
| GET/POST/PUT/PATCH/DELETE | `/api/meal-plans` | nutrizionista | piani alimentari (alimenti con quantità e alternative, orari, fabbisogni, note, introduzione formattata ripulita dal server) |
| GET/POST/PUT/PATCH/DELETE | `/api/workout-plans` | personal trainer | schede di allenamento |
| GET/POST/DELETE | `/api/checkins` | professionisti | controlli e misurazioni |
| GET/POST/PUT/PATCH/DELETE | `/api/appointments` | tutti (modifica solo il professionista) | agenda: appuntamenti "dalle – alle", niente sovrapposizioni |
| GET | `/api/appointments/busy` | professionisti | orari già occupati di un giorno (propri e, in forma anonima, del cliente) |
| GET/POST | `/api/messages` | tutti | conversazioni tra cliente, professionisti e colleghi |
| GET/POST/DELETE | `/api/me/meal-plan` · `/workout-plan` · `/checkins` | cliente | le sue pagine e le pesate |
| PATCH · PUT | `/api/auth/me` · `/api/auth/password` | autenticati | profilo (foto, dettagli, orari di lavoro, tema e lingua) e cambio password |

## Stato del progetto

**Pronto:**
- login e registrazione con ruoli (sfondo a onde; foto e schede cambiano con il profilo scelto), dashboard di Cliente / Nutrizionista / Personal Trainer;
- cliente: alimentazione giorno per giorno (alimenti, quantità, alternative, orari, confronto con i fabbisogni, PDF), allenamenti e scheda, progressi con pesate, agenda, esito dei controlli, messaggi;
- nutrizionista: editor dei piani alimentari come da mockup (cliente e obiettivo, introduzione con testo formattato, immagini e tabelle, giorni a schede fino a 14, pasti con orario riordinabili, alimenti e ricette suggeriti con calorie e macro calcolati, alternative e note, fabbisogni calcolabili dai dati del cliente, totale del giorno, bozza / pubblica, esporta PDF, modelli, copia e duplica), agenda, misurazioni, progressi dei clienti, attività fisica condivisa;
- personal trainer: editor delle schede (esercizi suggeriti, sessioni modello, stima della durata, duplica scheda), agenda, progressi, check nutrizionali condivisi;
- agenda per tutti i ruoli: vista settimana / mese / elenco, orari "dalle – alle", calendario per scegliere la data, nessuna sovrapposizione (né per il professionista né per il cliente), orario di lavoro e primo orario libero;
- gestione clienti, richieste di collegamento e consenso alla condivisione;
- profilo personalizzabile: foto, colore dell'avatar, copertina, dati personali, obiettivi e salute (cliente), professione, specializzazioni e orari (professionisti);
- tema chiaro / scuro / automatico, lingua italiana e inglese (dizionario in `client/src/i18n/en.js`), menu laterale riducibile;
- messaggi (aggiornati ogni pochi secondi), centro assistenza, ricerca rapida;
- layout responsive per computer, tablet e smartphone.

**Prossimi passi possibili:** recupero password via email, notifiche email/push, promemoria degli appuntamenti,
esportazione PDF delle schede di allenamento, accesso con Google, informativa privacy e consensi GDPR
(i dati sanitari sono "categorie particolari").
