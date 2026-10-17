import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n/index.js';
import { unitLabel } from '../lib/foods.js';
import { fmtDate, fmtNumber } from '../lib/format.js';
import { MEAL_META, WEEKDAYS } from '../lib/labels.js';
import { RichText } from './RichText.jsx';

// Versione stampabile di un piano alimentare: "Esporta PDF" apre la stampa del browser,
// da cui si sceglie "Salva come PDF". Si vede solo in stampa (vedi .print-root in index.css).

const mealName = (m) => (m.label && t(m.label)) || MEAL_META[m.type]?.label || m.type;
const sum = (items, key) => items.reduce((s, i) => s + (i[key] ?? 0), 0);
// Piani creati prima degli alimenti: il piatto del pasto vale come unico alimento
const itemsOf = (m) => (m.items?.length ? m.items : m.name ? [{ name: m.name, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat }] : []);

/**
 * plan: { title, goal, intro, kcalTarget, proteinTarget, carbsTarget, fatTarget, waterLiters, notes, days }
 * people: { client, nutritionist } (nomi da mostrare); onDone: chiamata quando la stampa si chiude.
 */
export function PlanPrint({ plan, people = {}, onDone }) {
  useEffect(() => {
    const previous = document.title;
    document.title = [plan.title, people.client].filter(Boolean).join(' – ');
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      document.title = previous;
      onDone?.();
    };
    window.addEventListener('afterprint', done, { once: true });
    const timer = setTimeout(() => {
      window.print();
      // Alcuni browser non inviano "afterprint": chiudiamo comunque poco dopo
      setTimeout(done, 1000);
    }, 120);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', done);
      document.title = previous;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekly = plan.days.length === 7;
  const targets = [
    [t('Energia'), plan.kcalTarget, 'kcal'],
    [t('Proteine'), plan.proteinTarget, 'g'],
    [t('Carboidrati'), plan.carbsTarget, 'g'],
    [t('Grassi'), plan.fatTarget, 'g'],
    [t('Idratazione'), plan.waterLiters, 'L'],
  ].filter(([, v]) => v != null);

  return createPortal(
    <div className="print-root text-[12px] leading-relaxed">
      <header className="flex items-end justify-between border-b-2 border-brand-700 pb-3">
        <img src="/brand/logo-wordmark.svg" alt="Wellsyn" className="h-9 w-auto" />
        <p className="text-right text-[11px] text-ink-500">{t('Generato il {date}', { date: fmtDate(new Date()) })}</p>
      </header>

      <h1 className="mt-5 font-display text-[24px] font-semibold text-ink-900">{plan.title}</h1>
      <p className="mt-1 text-ink-700">
        {people.client && (
          <>
            {t('Per')}: <strong>{people.client}</strong>
          </>
        )}
        {people.nutritionist && (
          <>
            {' · '}
            {t('A cura di')}: <strong>{people.nutritionist}</strong>
          </>
        )}
        {plan.goal && (
          <>
            {' · '}
            {t('Obiettivo')}: <strong>{t(plan.goal)}</strong>
          </>
        )}
      </p>

      {targets.length > 0 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {targets.map(([label, value, unit]) => (
            <div key={label} className="rounded-lg border border-line px-3 py-2">
              <p className="text-[10px] tracking-wide text-ink-500 uppercase">{label}</p>
              <p className="font-display text-[15px] font-semibold text-ink-900">
                {fmtNumber(value, unit === 'L' ? 1 : 0)} {unit}
              </p>
            </div>
          ))}
        </div>
      )}

      {plan.intro && (
        <section className="mt-5">
          <h2 className="font-display text-[15px] font-semibold text-ink-900">{t('Introduzione e obiettivi del piano')}</h2>
          <RichText html={plan.intro} className="mt-1.5 text-ink-700" />
        </section>
      )}

      {plan.notes?.length > 0 && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="font-display text-[15px] font-semibold text-ink-900">{t('Note e preferenze')}</h2>
          <ul className="mt-1.5 list-disc pl-5 text-ink-700">
            {plan.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {plan.days.map((day, di) => {
        const items = day.meals.flatMap(itemsOf);
        if (!day.meals.length) return null;
        return (
          <section key={di} className="mt-6 break-inside-avoid-page">
            <h2 className="flex items-baseline justify-between border-b border-line pb-1 font-display text-[16px] font-semibold text-ink-900">
              <span>
                {t('Giorno {n}', { n: di + 1 })}
                {weekly && <span className="font-normal text-ink-500"> · {WEEKDAYS[di].long}</span>}
              </span>
              <span className="text-[12px] font-normal text-ink-500">
                {fmtNumber(sum(items, 'kcal'), 0)} kcal · {t('P')} {fmtNumber(sum(items, 'protein'), 0)} g · {t('C')} {fmtNumber(sum(items, 'carbs'), 0)} g · {t('G')} {fmtNumber(sum(items, 'fat'), 0)} g
              </span>
            </h2>
            {day.meals.map((m, mi) => (
              <div key={mi} className="mt-3 break-inside-avoid">
                <p className="font-semibold text-ink-900">
                  {mealName(m)}
                  {(m.start || m.end) && <span className="font-normal text-ink-500"> · {[m.start, m.end].filter(Boolean).join(' - ')}</span>}
                </p>
                <table className="mt-1 w-full border-collapse text-left">
                  <tbody>
                    {itemsOf(m).map((i, ii) => (
                      <tr key={ii} className="border-b border-line/70">
                        <td className="w-[38%] py-1 pr-2 text-ink-900">{i.name}</td>
                        <td className="w-[16%] py-1 pr-2 text-ink-700">{i.unit === 'q.b.' ? unitLabel('q.b.') : i.quantity != null ? `${fmtNumber(i.quantity, i.quantity % 1 ? 1 : 0)} ${unitLabel(i.unit)}` : ''}</td>
                        <td className="py-1 pr-2 text-ink-500">{i.alternative ? `${t('In alternativa:')} ${i.alternative}` : ''}</td>
                        <td className="w-[10%] py-1 text-right text-ink-500">{i.kcal != null ? `${fmtNumber(i.kcal, 0)} kcal` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {m.note && <p className="mt-1 text-ink-500 italic">{m.note}</p>}
              </div>
            ))}
          </section>
        );
      })}

      <p className="mt-8 border-t border-line pt-2 text-[10px] text-ink-400">{t('Wellsyn – Your wellness. Connected. · Valori nutrizionali indicativi.')}</p>
    </div>,
    document.body,
  );
}
