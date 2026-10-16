import { ChevronDown, LifeBuoy, MessageSquareText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '../../components/forms.jsx';
import { Card, CardHeader } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { messagesPath } from '../../navigation.js';

// Domande frequenti per ciascun profilo.
const FAQ = {
  client: [
    ['Come segno un allenamento come fatto?', 'Dalla Dashboard o da "I miei allenamenti" premi "Segna come completato" sulla sessione di oggi. Puoi annullare con "Annulla".'],
    ['Come spunto i pasti?', 'In Dashboard o in "La mia alimentazione", nella giornata di oggi, tocca il cerchio accanto a ogni pasto consumato.'],
    ['Come registro il mio peso?', 'Vai in "Progressi" e usa il riquadro "Registra il tuo peso". Puoi eliminare una pesata sbagliata dallo storico.'],
    ['Un professionista mi ha aggiunto: cosa devo fare?', 'Trovi la richiesta in "Professionisti": premi "Accetta" per iniziare a lavorare insieme, oppure "Rifiuta".'],
    ['Cosa vuol dire "Condividi i dati del mio team"?', 'Ogni professionista vede solo i dati che registra lui. Attivando la condivisione permetti, ad esempio, alla nutrizionista di vedere i tuoi allenamenti e al personal trainer di vedere i tuoi check nutrizionali. Puoi disattivarla quando vuoi.'],
    ['Come cambio password o obiettivo?', 'Dal menu "Impostazioni" puoi modificare il profilo, l\'obiettivo principale e la password.'],
  ],
  nutritionist: [
    ['Come aggiungo un cliente?', 'In "Clienti" premi "Aggiungi cliente". Se ha già un account riceve una richiesta da accettare; altrimenti creiamo l\'account e ti mostriamo una password temporanea da consegnargli.'],
    ['Come creo un piano alimentare?', 'In "Piani alimentari" premi "Nuovo piano", scegli il cliente e compila i pasti giorno per giorno. Con "Copia questo giorno" puoi ripetere un menù su tutta la settimana.'],
    ['Perché il vecchio piano è stato archiviato?', 'Ogni cliente ha un solo piano attivo: quando ne attivi uno nuovo, il precedente viene archiviato e resta consultabile nella scheda "Archiviati".'],
    ['Come registro un controllo?', 'Da "Controlli" → "Misurazioni" oppure dalla pagina "Progressi" del cliente, con "Registra controllo". Compila solo le misure rilevate.'],
    ['Perché non vedo gli allenamenti di un cliente?', 'I dati del personal trainer sono visibili solo se il cliente ha attivato la condivisione dalla sua sezione "Professionisti".'],
  ],
  trainer: [
    ['Come aggiungo un cliente?', 'In "Clienti" premi "Aggiungi cliente". Se ha già un account riceve una richiesta da accettare; altrimenti creiamo l\'account e ti mostriamo una password temporanea da consegnargli.'],
    ['Come creo una scheda?', 'In "Schede allenamento" premi "Nuova scheda", scegli il cliente, aggiungi le sessioni (una per giorno) e gli esercizi con serie, ripetizioni e recupero.'],
    ['Come programmo una sessione?', 'In "Sessioni" premi "Nuova sessione": il cliente la vedrà nella sua sezione Controlli. Dopo la sessione segnala come "Svolto".'],
    ['Perché non vedo i check nutrizionali di un cliente?', 'Sono visibili solo se il cliente ha attivato la condivisione dalla sua sezione "Professionisti".'],
    ['Come vedo la costanza di un cliente?', 'Nella pagina "Progressi" trovi grafico settimanale, calendario delle ultime 4 settimane e storico degli allenamenti.'],
  ],
};

export default function SupportPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-5">
      <PageHeader title="Centro assistenza" subtitle="Risposte rapide alle domande più comuni su Wellsyn." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <CardHeader icon={LifeBuoy} title="Domande frequenti" />
          <div className="mt-4 divide-y divide-line">
            {FAQ[user.role].map(([q, a]) => (
              <details key={q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                  {q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-ink-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{a}</p>
              </details>
            ))}
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <CardHeader icon={MessageSquareText} title="Serve altro aiuto?" />
            <p className="mt-3 text-sm text-ink-700">
              {user.role === 'client'
                ? 'Per dubbi sul tuo piano o sui tuoi allenamenti scrivi direttamente ai tuoi professionisti.'
                : 'Per dubbi su un cliente puoi scrivergli direttamente, oppure confrontarti con i colleghi che lo seguono.'}
            </p>
            <Link to={messagesPath(user.role)} className="btn-primary mt-4">
              Apri i messaggi
            </Link>
          </Card>
          <Card className="p-5">
            <CardHeader icon={ShieldCheck} title="I tuoi dati" />
            <p className="mt-3 text-sm text-ink-700">
              I dati sono conservati su server in Europa. Ogni professionista vede solo ciò che registra lui; il resto solo con
              l'autorizzazione del cliente, che può revocarla in qualsiasi momento.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
