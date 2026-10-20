import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { parse } from '../utils/validate.js';

// Prodotti confezionati e di marca (es. "Nutella", "yogurt greco Fage") per la ricerca degli alimenti
// nell'editor dei piani alimentari. I dati vengono da Open Food Facts (https://world.openfoodfacts.org,
// licenza Open Database License): il server fa da tramite, così il browser dell'utente non li contatta direttamente.
const router = Router();
router.use(requireAuth);

const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const FIELDS = 'code,product_name,product_name_it,product_name_en,brands,quantity,serving_quantity,nutriments';
const USER_AGENT = 'Wellsyn/1.0 (https://wellsyn.vercel.app)';
const MAX_RESULTS = 12;

// Le stesse ricerche (es. "barilla") si ripetono spesso: le risposte restano in memoria per un giorno.
const cache = new Map();
const CACHE_SIZE = 300;
const CACHE_MS = 24 * 60 * 60 * 1000;

const querySchema = z.object({
  q: z.string({ error: 'Scrivi cosa cercare.' }).trim().min(3, 'Scrivi almeno 3 lettere.').max(60, 'Ricerca troppo lunga.'),
});

const r1 = (n) => Math.round(n * 10) / 10;
const numberOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && !Number.isNaN(Number(v)) ? Number(v) : null);

/** Prodotto di Open Food Facts → alimento con i valori per 100 g (o 100 ml); null se mancano i valori. */
function toFood(p) {
  const n = p.nutriments ?? {};
  let kcal = numberOrNull(n['energy-kcal_100g']);
  if (kcal == null && numberOrNull(n.energy_100g) != null) kcal = numberOrNull(n.energy_100g) / 4.184; // da kJ
  const protein = numberOrNull(n.proteins_100g);
  const carbs = numberOrNull(n.carbohydrates_100g);
  const fat = numberOrNull(n.fat_100g);
  const name = (p.product_name_it || p.product_name || p.product_name_en || '').trim().replace(/\s+/g, ' ');
  if (!name || kcal == null || protein == null || carbs == null || fat == null || kcal > 950) return null;
  const brand = [...new Set((Array.isArray(p.brands) ? p.brands : String(p.brands ?? '').split(',')).map((b) => b.trim()).filter(Boolean))][0] ?? null;
  const liquid = /\d\s*(ml|cl|l)\b/i.test(p.quantity ?? '');
  const serving = numberOrNull(p.serving_quantity);
  const portion = serving > 0 && serving <= 2000 ? r1(serving) : null;
  return {
    id: `off-${p.code}`,
    name: name.slice(0, 100),
    brand: brand?.slice(0, 40) ?? null,
    kcal: Math.round(kcal),
    protein: r1(protein),
    carbs: r1(carbs),
    fat: r1(fat),
    unit: liquid ? 'ml' : 'g',
    qty: portion ?? (liquid ? 200 : 100),
    portion,
  };
}

async function search(q, onlyItaly) {
  const params = new URLSearchParams({
    q: onlyItaly ? `${q} countries_tags:"en:italy"` : q,
    page_size: '40',
    langs: 'it,en',
    fields: FIELDS,
  });
  const res = await fetch(`${SEARCH_URL}?${params}`, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`Open Food Facts: ${res.status}`);
  const { hits = [] } = await res.json();
  return hits.map(toFood).filter(Boolean);
}

router.get('/products', async (req, res) => {
  const { q } = parse(querySchema, req.query);
  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return res.json({ products: cached.products });

  let found;
  try {
    // Prima i prodotti venduti in Italia; se sono pochi, anche quelli degli altri paesi
    found = await search(q, true);
    if (found.length < 6) found = [...found, ...(await search(q, false))];
  } catch {
    throw new HttpError(503, 'Ricerca dei prodotti confezionati non disponibile al momento. Riprova tra poco.');
  }

  // Lo stesso prodotto compare spesso più volte (formati o marche scritte in modo diverso): ne resta uno
  const seen = new Set();
  const products = [];
  for (const p of found) {
    const same = `${p.name.toLowerCase()}|${p.kcal}`;
    if (seen.has(same) || seen.has(p.id)) continue;
    seen.add(same).add(p.id);
    products.push(p);
    if (products.length === MAX_RESULTS) break;
  }

  if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), products });
  res.json({ products });
});

export default router;
