import { ChevronDown, LifeBuoy, MessageSquareText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '../../components/forms.jsx';
import { Card, CardHeader } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { messagesPath } from '../../navigation.js';
import { t } from '../../i18n/index.js';

// Domande frequenti per ciascun profilo (tradotte quando vengono mostrate).
const ADD_CLIENT = [
  'Come aggiungo un cliente?',
  "In \"Clienti\" premi \"Aggiungi cliente\". Se ha già un account riceve una richiesta da accettare; altrimenti creiamo l'account e ti mostriamo una password temporanea da consegnargli.",
];
const FAQ = {
  client: [
    ['Come segno un allenamento come fatto?', 'Dalla Dashboard o da "I miei allenamenti" premi "Segna come completato" sulla sessione di oggi. Puoi annullare con "Annulla".'],
    ['Come spunto i pasti?', 'In Dashboard o in "La mia alimentazione", nella giornata di oggi, tocca il cerchio accanto a ogni pasto consumato.'],
    ['Come registro il mio peso?', 'Vai in "Progressi" e usa il riquadro "Registra il tuo peso". Puoi eliminare una pesata sbagliata dallo storico.'],
    ['Dove vedo i miei appuntamenti?', 'Nella sezione "Agenda" trovi gli appuntamenti con i tuoi professionisti, per settimana, per mese o in elenco. In "Controlli" trovi invece l’esito dei controlli.'],
    ['Un professionista mi ha aggiunto: cosa devo fare?', 'Trovi la richiesta in "Professionisti": premi "Accetta" per iniziare a lavorare insieme, oppure "Rifiuta".'],
    ['Cosa vuol dire "Condividi i dati del mio team"?', 'Ogni professionista vede solo i dati che registra lui. Attivando la condivisione permetti, ad esempio, alla nutrizionista di vedere i tuoi allenamenti e al personal trainer di vedere i tuoi check nutrizionali. Puoi disattivarla quando vuoi.'],
    ['Come cambio foto, tema o password?', 'Da "Profilo e impostazioni" puoi cambiare foto, dati personali, obiettivi, tema chiaro o scuro, lingua e password.'],
  ],
  nutritionist: [
    ADD_CLIENT,
    ['Come creo un piano alimentare?', 'In "Piani alimentari" premi "Nuovo piano", scegli il cliente e componi i pasti: scrivendo il nome di un piatto ti suggeriamo calorie e macronutrienti. Puoi partire da un modello, copiare un giorno su altri giorni o duplicare un piano esistente.'],
    ['Perché il vecchio piano è stato archiviato?', 'Ogni cliente ha un solo piano attivo: quando ne attivi uno nuovo, il precedente viene archiviato e resta consultabile nella scheda "Archiviati".'],
    ['Come fisso un appuntamento?', 'In "Agenda" premi "Nuovo appuntamento" oppure clicca uno spazio libero della settimana. Scegli il giorno e l’orario "dalle – alle": gli orari già occupati sono segnati e due appuntamenti non possono sovrapporsi.'],
    ['Come registro un controllo?', 'Da "Controlli" oppure dalla pagina "Progressi" del cliente, con "Registra controllo". Compila solo le misure rilevate.'],
    ['Perché non vedo gli allenamenti di un cliente?', 'I dati del personal trainer sono visibili solo se il cliente ha attivato la condivisione dalla sua sezione "Professionisti".'],
  ],
  trainer: [
    ADD_CLIENT,
    ['Come creo una scheda?', 'In "Schede allenamento" premi "Nuova scheda", scegli il cliente e aggiungi le sessioni: puoi partire da un modello e, scrivendo il nome di un esercizio, ti suggeriamo serie, ripetizioni e recupero.'],
    ['Come programmo una sessione?', 'In "Agenda" premi "Nuova sessione" oppure clicca uno spazio libero della settimana: il cliente la vedrà nella sua agenda. Due sessioni non possono sovrapporsi.'],
    ['Perché non vedo i check nutrizionali di un cliente?', 'Sono visibili solo se il cliente ha attivato la condivisione dalla sua sezione "Professionisti".'],
    ['Come vedo la costanza di un cliente?', 'In "Progressi" scegli il cliente dall’elenco: trovi il grafico settimanale, il calendario delle ultime 4 settimane e lo storico degli allenamenti.'],
  ],
};

export default function SupportPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-5">
      <PageHeader title={t('Centro assistenza')} subtitle={t('Risposte rapide alle domande più comuni su Wellsyn.')} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <CardHeader icon={LifeBuoy} title={t('Domande frequenti')} />
          <div className="mt-4 divide-y divide-line">
            {FAQ[user.role].map(([q, a]) => (
              <details key={q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                  {t(q)}
                  <ChevronDown className="h-4 w-4 shrink-0 text-ink-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{t(a)}</p>
              </details>
            ))}
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <CardHeader icon={MessageSquareText} title={t('Serve altro aiuto?')} />
            <p className="mt-3 text-sm text-ink-700">
              {user.role === 'client'
                ? t('Per dubbi sul tuo piano o sui tuoi allenamenti scrivi direttamente ai tuoi professionisti.')
                : t('Per dubbi su un cliente puoi scrivergli direttamente, oppure confrontarti con i colleghi che lo seguono.')}
            </p>
            <Link to={messagesPath(user.role)} className="btn-primary mt-4">
              {t('Apri i messaggi')}
            </Link>
          </Card>
          <Card className="p-5">
            <CardHeader icon={ShieldCheck} title={t('I tuoi dati')} />
            <p className="mt-3 text-sm text-ink-700">
              {t("I dati sono conservati su server in Europa. Ogni professionista vede solo ciò che registra lui; il resto solo con l'autorizzazione del cliente, che può revocarla in qualsiasi momento.")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
