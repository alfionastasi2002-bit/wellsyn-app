// Libreria degli alimenti e delle ricette usata dall'editor dei piani alimentari (e dai dati demo).
// Valori nutrizionali indicativi per 100 g (o 100 ml): kcal, proteine (p), carboidrati (c), grassi (f).
// unit/qty = quantità proposta quando si sceglie l'alimento; piece/slice/spoon/tsp = grammi di un pezzo,
// di una fetta, di un cucchiaio e di un cucchiaino di quell'alimento.

export const FOOD_UNITS = ['g', 'ml', 'pz', 'fetta', 'cucchiaio', 'cucchiaino', 'tazza', 'porzione', 'q.b.'];

const NOT_VEG = new Set(['carne', 'pesce']);
const food = (id, it, en, emoji, cat, kcal, p, c, f, opts = {}) => ({
  id,
  it,
  en,
  emoji,
  cat,
  kcal,
  protein: p,
  carbs: c,
  fat: f,
  unit: 'g',
  qty: 100,
  veg: !NOT_VEG.has(cat),
  ...opts,
});

export const FOODS = [
  // Cereali, pane e tuberi
  food('avena', "Fiocchi d'avena", 'Rolled oats', '🥣', 'cereali', 372, 13, 63, 7, { qty: 50 }),
  food('muesli', 'Muesli senza zuccheri', 'Unsweetened muesli', '🥣', 'cereali', 360, 10, 62, 6, { qty: 40 }),
  food('granola', 'Granola senza zuccheri aggiunti', 'No-added-sugar granola', '🥣', 'cereali', 430, 11, 60, 16, { qty: 30 }),
  food('cornflakes', 'Corn flakes', 'Corn flakes', '🥣', 'cereali', 378, 7, 84, 0.9, { qty: 30 }),
  food('pane-integrale', 'Pane integrale', 'Wholemeal bread', '🍞', 'cereali', 242, 9, 45, 3, { qty: 50, slice: 35 }),
  food('pane-segale', 'Pane di segale', 'Rye bread', '🍞', 'cereali', 259, 8.5, 48, 3.3, { qty: 50, slice: 35 }),
  food('pane', 'Pane comune', 'White bread', '🥖', 'cereali', 270, 8.5, 56, 1.5, { qty: 50, slice: 35 }),
  food('fette-biscottate', 'Fette biscottate integrali', 'Wholegrain rusks', '🍞', 'cereali', 380, 12, 68, 6, { unit: 'pz', qty: 4, piece: 10 }),
  food('gallette-riso', 'Gallette di riso', 'Rice cakes', '🍘', 'cereali', 387, 8, 81, 2.8, { unit: 'pz', qty: 3, piece: 8 }),
  food('cracker-integrali', 'Cracker integrali', 'Wholegrain crackers', '🍘', 'cereali', 410, 11, 68, 10, { qty: 25, piece: 6 }),
  food('pasta', 'Pasta di semola', 'Durum wheat pasta', '🍝', 'cereali', 353, 12.5, 72, 1.5, { qty: 80 }),
  food('pasta-integrale', 'Pasta integrale', 'Wholewheat pasta', '🍝', 'cereali', 340, 13, 66, 2.5, { qty: 80 }),
  food('riso-basmati', 'Riso basmati', 'Basmati rice', '🍚', 'cereali', 350, 7.5, 78, 0.6, { qty: 80 }),
  food('riso-integrale', 'Riso integrale', 'Brown rice', '🍚', 'cereali', 360, 7.5, 76, 2.7, { qty: 80 }),
  food('riso-venere', 'Riso venere', 'Black rice', '🍚', 'cereali', 360, 8, 75, 2.6, { qty: 70 }),
  food('quinoa', 'Quinoa', 'Quinoa', '🥣', 'cereali', 368, 14, 64, 6, { qty: 70 }),
  food('farro', 'Farro', 'Spelt', '🌾', 'cereali', 335, 15, 67, 2.5, { qty: 70 }),
  food('orzo', 'Orzo perlato', 'Pearl barley', '🌾', 'cereali', 350, 10, 73, 1.4, { qty: 70 }),
  food('couscous', 'Couscous integrale', 'Wholewheat couscous', '🥣', 'cereali', 360, 12.5, 72, 1.5, { qty: 70 }),
  food('patate', 'Patate', 'Potatoes', '🥔', 'cereali', 77, 2, 17, 0.1, { qty: 200, piece: 150 }),
  food('patate-dolci', 'Patate dolci', 'Sweet potatoes', '🍠', 'cereali', 86, 1.6, 20, 0.1, { qty: 200, piece: 200 }),
  food('cornetto-integrale', 'Cornetto integrale', 'Wholegrain croissant', '🥐', 'cereali', 400, 8, 48, 19, { unit: 'pz', qty: 1, piece: 50 }),
  food('pizza-margherita', 'Pizza margherita', 'Margherita pizza', '🍕', 'cereali', 250, 11, 33, 8, { unit: 'pz', qty: 1, piece: 320 }),

  // Latte, yogurt, formaggi e uova
  food('latte-ps', 'Latte parzialmente scremato', 'Semi-skimmed milk', '🥛', 'latticini', 46, 3.3, 5, 1.6, { unit: 'ml', qty: 200, cup: 200 }),
  food('latte-scremato', 'Latte scremato', 'Skimmed milk', '🥛', 'latticini', 34, 3.4, 5, 0.2, { unit: 'ml', qty: 200, cup: 200 }),
  food('latte-intero', 'Latte intero', 'Whole milk', '🥛', 'latticini', 64, 3.3, 4.9, 3.6, { unit: 'ml', qty: 200, cup: 200 }),
  food('bevanda-soia', 'Bevanda di soia senza zuccheri', 'Unsweetened soy drink', '🥛', 'latticini', 33, 3.3, 0.7, 1.9, { unit: 'ml', qty: 200, cup: 200 }),
  food('bevanda-avena', "Bevanda d'avena", 'Oat drink', '🥛', 'latticini', 46, 1, 6.7, 1.5, { unit: 'ml', qty: 200, cup: 200 }),
  food('yogurt-greco', 'Yogurt greco 0%', 'Greek yogurt 0%', '🥣', 'latticini', 57, 10, 4, 0, { qty: 150, piece: 170 }),
  food('yogurt-bianco', 'Yogurt bianco', 'Plain yogurt', '🥣', 'latticini', 66, 3.8, 4.7, 3.5, { qty: 125, piece: 125 }),
  food('skyr', 'Skyr', 'Skyr', '🥣', 'latticini', 63, 11, 4, 0.2, { qty: 150, piece: 150 }),
  food('kefir', 'Kefir', 'Kefir', '🥛', 'latticini', 52, 3.5, 4.5, 2, { unit: 'ml', qty: 200 }),
  food('ricotta', 'Ricotta vaccina', 'Ricotta', '🧀', 'latticini', 138, 9, 3.5, 10, { qty: 80 }),
  food('fiocchi-latte', 'Fiocchi di latte', 'Cottage cheese', '🧀', 'latticini', 98, 11, 3.4, 4.3, { qty: 150 }),
  food('mozzarella', 'Mozzarella', 'Mozzarella', '🧀', 'latticini', 253, 18.7, 0.7, 19.5, { qty: 100, piece: 125 }),
  food('parmigiano', 'Parmigiano Reggiano', 'Parmigiano Reggiano', '🧀', 'latticini', 392, 33, 0, 28.4, { qty: 20, spoon: 5 }),
  food('feta', 'Feta', 'Feta', '🧀', 'latticini', 264, 14, 4, 21, { qty: 40 }),
  food('uova', 'Uova', 'Eggs', '🥚', 'latticini', 143, 12.6, 0.7, 9.5, { unit: 'pz', qty: 2, piece: 55 }),
  food('albume', "Albume d'uovo", 'Egg whites', '🥚', 'latticini', 52, 11, 0.7, 0.2, { qty: 150, piece: 33 }),

  // Carne
  food('pollo', 'Petto di pollo', 'Chicken breast', '🍗', 'carne', 100, 23, 0, 0.8, { qty: 150 }),
  food('tacchino', 'Fesa di tacchino', 'Turkey breast', '🍗', 'carne', 107, 24, 0, 1.2, { qty: 130, slice: 20 }),
  food('manzo', 'Manzo magro', 'Lean beef', '🥩', 'carne', 131, 21.3, 0, 5, { qty: 130 }),
  food('bresaola', 'Bresaola', 'Bresaola', '🥩', 'carne', 151, 32, 0.4, 2.6, { qty: 40, slice: 8 }),
  food('prosciutto-crudo', 'Prosciutto crudo sgrassato', 'Lean prosciutto', '🥓', 'carne', 145, 28, 0, 4, { qty: 40, slice: 10 }),
  food('prosciutto-cotto', 'Prosciutto cotto', 'Cooked ham', '🥓', 'carne', 132, 19.8, 0.9, 5.4, { qty: 50, slice: 15 }),

  // Pesce
  food('salmone', 'Salmone', 'Salmon', '🐟', 'pesce', 185, 18.4, 0, 12, { qty: 130 }),
  food('salmone-affumicato', 'Salmone affumicato', 'Smoked salmon', '🐟', 'pesce', 147, 25.4, 0, 4.5, { qty: 60, slice: 15 }),
  food('tonno-naturale', 'Tonno al naturale', 'Tuna in water', '🐟', 'pesce', 103, 23.5, 0, 1, { qty: 80, piece: 56 }),
  food('tonno-fresco', 'Tonno fresco', 'Fresh tuna', '🐟', 'pesce', 144, 23, 0, 4.9, { qty: 130 }),
  food('merluzzo', 'Merluzzo', 'Cod', '🐟', 'pesce', 71, 17, 0, 0.3, { qty: 180 }),
  food('orata', 'Orata', 'Sea bream', '🐟', 'pesce', 121, 20, 0, 4, { qty: 200 }),
  food('branzino', 'Branzino', 'Sea bass', '🐟', 'pesce', 82, 16.5, 0.6, 1.5, { qty: 200 }),
  food('sgombro', 'Sgombro', 'Mackerel', '🐟', 'pesce', 170, 17, 0.5, 11, { qty: 130 }),
  food('gamberi', 'Gamberi', 'Prawns', '🦐', 'pesce', 71, 14, 1, 0.6, { qty: 150 }),

  // Legumi e proteine vegetali
  food('ceci', 'Ceci lessati', 'Cooked chickpeas', '🫘', 'legumi', 120, 7, 18, 2.4, { qty: 120 }),
  food('lenticchie', 'Lenticchie lessate', 'Cooked lentils', '🫘', 'legumi', 116, 9, 20, 0.4, { qty: 150 }),
  food('borlotti', 'Fagioli borlotti lessati', 'Cooked borlotti beans', '🫘', 'legumi', 104, 7.3, 16, 0.6, { qty: 150 }),
  food('piselli', 'Piselli', 'Peas', '🫛', 'legumi', 76, 5.5, 12.4, 0.6, { qty: 150 }),
  food('edamame', 'Edamame', 'Edamame', '🫛', 'legumi', 121, 12, 9, 5, { qty: 60 }),
  food('tofu', 'Tofu', 'Tofu', '🥢', 'legumi', 138, 14, 2, 8, { qty: 150 }),
  food('hummus', 'Hummus', 'Hummus', '🫘', 'legumi', 166, 8, 14, 9.6, { qty: 50, spoon: 15 }),

  // Verdura
  food('verdure', 'Verdure di stagione', 'Seasonal vegetables', '🥗', 'verdura', 30, 1.8, 5, 0.3, { qty: 200 }),
  food('insalata', 'Insalata mista', 'Mixed salad', '🥗', 'verdura', 15, 1.4, 2.9, 0.2, { qty: 80 }),
  food('spinaci', 'Spinaci', 'Spinach', '🥬', 'verdura', 23, 2.9, 3.6, 0.4, { qty: 150 }),
  food('rucola', 'Rucola', 'Rocket', '🥬', 'verdura', 25, 2.6, 3.7, 0.7, { qty: 50 }),
  food('zucchine', 'Zucchine', 'Courgettes', '🥒', 'verdura', 17, 1.2, 3.1, 0.3, { qty: 200 }),
  food('broccoli', 'Broccoli', 'Broccoli', '🥦', 'verdura', 34, 2.8, 6.6, 0.4, { qty: 200 }),
  food('cavolfiore', 'Cavolfiore', 'Cauliflower', '🥦', 'verdura', 25, 1.9, 5, 0.3, { qty: 200 }),
  food('pomodori', 'Pomodori', 'Tomatoes', '🍅', 'verdura', 18, 0.9, 3.9, 0.2, { qty: 150, piece: 120 }),
  food('pomodorini', 'Pomodorini', 'Cherry tomatoes', '🍅', 'verdura', 18, 0.9, 3.9, 0.2, { qty: 150, piece: 15 }),
  food('passata', 'Passata di pomodoro', 'Tomato passata', '🍅', 'verdura', 25, 1.3, 4.5, 0.2, { qty: 100 }),
  food('carote', 'Carote', 'Carrots', '🥕', 'verdura', 41, 0.9, 9.6, 0.2, { qty: 100, piece: 80 }),
  food('cetrioli', 'Cetrioli', 'Cucumber', '🥒', 'verdura', 15, 0.7, 3.6, 0.1, { qty: 100 }),
  food('peperoni', 'Peperoni', 'Peppers', '🫑', 'verdura', 31, 1, 6, 0.3, { qty: 150, piece: 160 }),
  food('melanzane', 'Melanzane', 'Aubergine', '🍆', 'verdura', 25, 1, 6, 0.2, { qty: 200 }),
  food('funghi', 'Funghi champignon', 'Button mushrooms', '🍄', 'verdura', 22, 3.1, 3.3, 0.3, { qty: 150 }),
  food('fagiolini', 'Fagiolini', 'Green beans', '🫛', 'verdura', 31, 1.8, 7, 0.2, { qty: 200 }),
  food('asparagi', 'Asparagi', 'Asparagus', '🌿', 'verdura', 20, 2.2, 3.9, 0.1, { qty: 150 }),
  food('finocchi', 'Finocchi', 'Fennel', '🌿', 'verdura', 31, 1.2, 7.3, 0.2, { qty: 200 }),

  // Frutta
  food('banana', 'Banana', 'Banana', '🍌', 'frutta', 89, 1.1, 23, 0.3, { unit: 'pz', qty: 1, piece: 120 }),
  food('mela', 'Mela', 'Apple', '🍎', 'frutta', 52, 0.3, 14, 0.2, { unit: 'pz', qty: 1, piece: 180 }),
  food('pera', 'Pera', 'Pear', '🍐', 'frutta', 57, 0.4, 15, 0.1, { unit: 'pz', qty: 1, piece: 170 }),
  food('arancia', 'Arancia', 'Orange', '🍊', 'frutta', 47, 0.9, 12, 0.1, { unit: 'pz', qty: 1, piece: 200 }),
  food('kiwi', 'Kiwi', 'Kiwi', '🥝', 'frutta', 61, 1.1, 15, 0.5, { unit: 'pz', qty: 2, piece: 75 }),
  food('pesca', 'Pesca', 'Peach', '🍑', 'frutta', 39, 0.9, 10, 0.3, { unit: 'pz', qty: 1, piece: 150 }),
  food('fragole', 'Fragole', 'Strawberries', '🍓', 'frutta', 32, 0.7, 7.7, 0.3, { qty: 150 }),
  food('frutti-bosco', 'Frutti di bosco', 'Mixed berries', '🫐', 'frutta', 50, 0.8, 11, 0.4, { qty: 100 }),
  food('mirtilli', 'Mirtilli', 'Blueberries', '🫐', 'frutta', 57, 0.7, 14.5, 0.3, { qty: 100 }),
  food('uva', 'Uva', 'Grapes', '🍇', 'frutta', 69, 0.7, 18, 0.2, { qty: 150 }),
  food('ananas', 'Ananas', 'Pineapple', '🍍', 'frutta', 50, 0.5, 13, 0.1, { qty: 150 }),
  food('anguria', 'Anguria', 'Watermelon', '🍉', 'frutta', 30, 0.6, 7.6, 0.2, { qty: 300 }),
  food('avocado', 'Avocado', 'Avocado', '🥑', 'frutta', 160, 2, 8.5, 14.7, { qty: 50, piece: 170 }),

  // Frutta secca e semi
  food('mandorle', 'Mandorle', 'Almonds', '🌰', 'frutta secca', 579, 21, 22, 50, { qty: 15, piece: 1.2 }),
  food('noci', 'Noci', 'Walnuts', '🌰', 'frutta secca', 654, 15, 14, 65, { qty: 15, piece: 5 }),
  food('nocciole', 'Nocciole', 'Hazelnuts', '🌰', 'frutta secca', 628, 15, 17, 61, { qty: 15, piece: 1.5 }),
  food('anacardi', 'Anacardi', 'Cashews', '🌰', 'frutta secca', 553, 18, 30, 44, { qty: 15 }),
  food('pistacchi', 'Pistacchi', 'Pistachios', '🌰', 'frutta secca', 560, 20, 28, 45, { qty: 15 }),
  food('semi-chia', 'Semi di chia', 'Chia seeds', '🌱', 'frutta secca', 486, 17, 42, 31, { qty: 10, spoon: 10, tsp: 4 }),
  food('burro-arachidi', 'Burro di arachidi', 'Peanut butter', '🥜', 'frutta secca', 588, 25, 20, 50, { unit: 'cucchiaio', qty: 1, spoon: 15, tsp: 6 }),
  food('cioccolato', 'Cioccolato fondente 85%', 'Dark chocolate 85%', '🍫', 'frutta secca', 598, 9, 30, 46, { qty: 20, piece: 5 }),

  // Condimenti e dolcificanti
  food('olio-evo', "Olio extravergine d'oliva", 'Extra virgin olive oil', '🫒', 'condimenti', 884, 0, 0, 100, { unit: 'cucchiaio', qty: 1, spoon: 10, tsp: 5 }),
  food('burro', 'Burro', 'Butter', '🧈', 'condimenti', 717, 0.9, 0.1, 81, { qty: 10, spoon: 10, tsp: 5 }),
  food('miele', 'Miele', 'Honey', '🍯', 'condimenti', 304, 0.3, 82, 0, { unit: 'cucchiaino', qty: 1, spoon: 20, tsp: 7 }),
  food('marmellata', 'Marmellata senza zuccheri aggiunti', 'No-added-sugar jam', '🍯', 'condimenti', 145, 0.5, 35, 0.1, { unit: 'cucchiaio', qty: 1, spoon: 20, tsp: 7 }),
  food('aceto-balsamico', 'Aceto balsamico', 'Balsamic vinegar', '🍶', 'condimenti', 88, 0.5, 17, 0, { unit: 'cucchiaino', qty: 1, spoon: 15, tsp: 5 }),

  // Bevande e altro
  food('caffe', 'Caffè', 'Coffee', '☕', 'bevande', 2, 0.1, 0, 0, { unit: 'pz', qty: 1, piece: 30 }),
  food('te-verde', 'Tè verde', 'Green tea', '🍵', 'bevande', 1, 0, 0.2, 0, { unit: 'tazza', qty: 1, cup: 250 }),
  food('proteine-polvere', 'Proteine in polvere (whey)', 'Whey protein powder', '🥤', 'bevande', 380, 78, 8, 5, { qty: 30, portion: 30 }),
  food('barretta-proteica', 'Barretta proteica', 'Protein bar', '🍫', 'bevande', 380, 33, 37, 13, { unit: 'pz', qty: 1, piece: 40 }),
];

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));

const CATEGORY_EMOJI = { cereali: '🌾', latticini: '🥛', carne: '🍗', pesce: '🐟', legumi: '🫘', verdura: '🥗', frutta: '🍎', 'frutta secca': '🌰', condimenti: '🫒', bevande: '🥤' };
export const emojiOf = (food) => food?.emoji ?? CATEGORY_EMOJI[food?.cat] ?? '🍽️';

/** Grammi (o ml) corrispondenti a una quantità nell'unità scelta. */
export function gramsOf(food, quantity, unit) {
  if (quantity == null || Number.isNaN(quantity)) return null;
  switch (unit) {
    case 'pz':
      return quantity * (food.piece ?? 100);
    case 'fetta':
      return quantity * (food.slice ?? 30);
    case 'cucchiaio':
      return quantity * (food.spoon ?? 10);
    case 'cucchiaino':
      return quantity * (food.tsp ?? 5);
    case 'tazza':
      return quantity * (food.cup ?? 200);
    case 'porzione':
      return quantity * (food.portion ?? 100);
    case 'q.b.':
      return 0;
    default:
      return quantity; // g e ml
  }
}

const r1 = (n) => Math.round(n * 10) / 10;

/** Calorie e macronutrienti di una quantità di alimento. */
export function nutritionOf(food, quantity, unit) {
  const grams = gramsOf(food, quantity, unit);
  if (grams == null) return { kcal: null, protein: null, carbs: null, fat: null };
  const k = grams / 100;
  return { kcal: Math.round(food.kcal * k), protein: r1(food.protein * k), carbs: r1(food.carbs * k), fat: r1(food.fat * k) };
}

/** Cerca alimenti per nome (italiano o inglese). */
export function searchFoods(query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const f of FOODS) {
    const names = [f.it.toLowerCase(), f.en.toLowerCase()];
    if (names.some((n) => n.startsWith(q) || n.split(/[\s']/).some((w) => w.startsWith(q)))) starts.push(f);
    else if (names.some((n) => n.includes(q))) contains.push(f);
  }
  // Prima i nomi che iniziano con il testo cercato, dai più corti ("Mela" prima di "Melanzane")
  const byStart = (x) => (x.it.toLowerCase().startsWith(q) || x.en.toLowerCase().startsWith(q) ? 0 : 1);
  starts.sort((a, b) => byStart(a) - byStart(b) || a.it.length - b.it.length);
  return [...starts, ...contains].slice(0, limit);
}

/** Alimento della libreria con questo nome (in una delle due lingue), se esiste. */
export const findFoodByName = (name) => {
  const n = name.trim().toLowerCase();
  return FOODS.find((f) => f.it.toLowerCase() === n || f.en.toLowerCase() === n) ?? null;
};

// Ricette: gruppi di alimenti pronti da inserire in un pasto
// item: [codice alimento, quantità, unità (facoltativa), alternativa (facoltativa, in italiano e inglese)]

const recipe = (id, type, it, en, items) => ({ id, type, it, en, items });

export const RECIPES = [
  // Colazione
  recipe('avena-latte-banana', 'colazione', 'Avena, latte e banana', 'Oats, milk and banana', [
    ['avena', 50, 'g', ['muesli senza zuccheri', 'unsweetened muesli']],
    ['latte-scremato', 200, 'ml', ['bevanda vegetale senza zuccheri', 'unsweetened plant drink']],
    ['banana', 1, 'pz', ['frutti di bosco (100 g)', 'mixed berries (100 g)']],
  ]),
  recipe('porridge', 'colazione', "Porridge d'avena con frutti di bosco", 'Oat porridge with berries', [
    ['avena', 50],
    ['latte-ps', 200, 'ml', ['bevanda di soia', 'soy drink']],
    ['frutti-bosco', 100],
    ['mandorle', 10],
  ]),
  recipe('yogurt-granola', 'colazione', 'Yogurt greco con granola', 'Greek yogurt with granola', [
    ['yogurt-greco', 170, 'g', ['skyr', 'skyr']],
    ['granola', 30],
    ['miele', 1, 'cucchiaino'],
  ]),
  recipe('pane-avocado-uovo', 'colazione', 'Pane integrale con avocado e uovo', 'Wholemeal toast with avocado and egg', [
    ['pane-segale', 60],
    ['avocado', 50],
    ['uova', 1, 'pz'],
  ]),
  recipe('pancake-proteici', 'colazione', 'Pancake proteici con frutta', 'Protein pancakes with fruit', [
    ['albume', 150],
    ['avena', 40],
    ['banana', 1, 'pz'],
    ['fragole', 100],
  ]),
  recipe('fette-ricotta', 'colazione', 'Fette biscottate con ricotta e marmellata', 'Rusks with ricotta and jam', [
    ['fette-biscottate', 4, 'pz'],
    ['ricotta', 80, 'g', ['fiocchi di latte', 'cottage cheese']],
    ['marmellata', 1, 'cucchiaio'],
  ]),
  recipe('omelette-spinaci', 'colazione', 'Omelette con spinaci', 'Spinach omelette', [
    ['uova', 2, 'pz'],
    ['spinaci', 100],
    ['pane-segale', 40],
  ]),
  recipe('smoothie-bowl', 'colazione', 'Smoothie bowl', 'Smoothie bowl', [
    ['banana', 1, 'pz'],
    ['frutti-bosco', 100],
    ['bevanda-soia', 150, 'ml'],
    ['semi-chia', 10],
  ]),

  // Spuntini e merende
  recipe('yogurt-mandorle', 'spuntino', 'Yogurt greco e mandorle', 'Greek yogurt and almonds', [
    ['yogurt-greco', 150, 'g', ['skyr', 'skyr']],
    ['mandorle', 15, 'g', ['noci o nocciole', 'walnuts or hazelnuts']],
  ]),
  recipe('frutta-noci', 'spuntino', 'Frutta fresca e noci', 'Fresh fruit and walnuts', [
    ['mela', 1, 'pz', ['pera', 'pear']],
    ['noci', 15],
  ]),
  recipe('gallette-bresaola', 'spuntino', 'Gallette di riso e bresaola', 'Rice cakes and bresaola', [
    ['gallette-riso', 3, 'pz'],
    ['bresaola', 40, 'g', ['fesa di tacchino', 'turkey breast']],
  ]),
  recipe('hummus-verdure', 'spuntino', 'Hummus e verdure crude', 'Hummus and raw vegetables', [
    ['hummus', 50],
    ['carote', 100],
    ['cetrioli', 100],
  ]),
  recipe('kefir-frutti', 'merenda', 'Kefir e frutti di bosco', 'Kefir and berries', [
    ['kefir', 200, 'ml'],
    ['frutti-bosco', 100],
  ]),
  recipe('toast-tacchino', 'merenda', 'Toast integrale con tacchino', 'Wholemeal toast with turkey', [
    ['pane-integrale', 50],
    ['tacchino', 40],
  ]),
  recipe('banana-arachidi', 'merenda', 'Banana e burro di arachidi', 'Banana and peanut butter', [
    ['banana', 1, 'pz'],
    ['burro-arachidi', 1, 'cucchiaio'],
  ]),
  recipe('parmigiano-cracker', 'merenda', 'Parmigiano e cracker integrali', 'Parmesan and wholegrain crackers', [
    ['parmigiano', 20],
    ['cracker-integrali', 25],
  ]),

  // Pranzo
  recipe('riso-pollo', 'pranzo', 'Riso integrale e pollo', 'Brown rice and chicken', [
    ['riso-integrale', 80, 'g', ['quinoa o farro', 'quinoa or spelt']],
    ['pollo', 150, 'g', ['tacchino o pesce bianco', 'turkey or white fish']],
    ['verdure', 200],
    ['olio-evo', 1, 'cucchiaio'],
  ]),
  recipe('farro-ceci', 'pranzo', 'Insalata di farro e ceci', 'Spelt and chickpea salad', [
    ['farro', 70],
    ['ceci', 120],
    ['pomodorini', 150],
    ['cetrioli', 100],
    ['feta', 30],
    ['olio-evo', 1, 'cucchiaino'],
  ]),
  recipe('pasta-pomodoro', 'pranzo', 'Pasta integrale al pomodoro', 'Wholewheat pasta with tomato', [
    ['pasta-integrale', 80],
    ['passata', 100],
    ['parmigiano', 10],
    ['olio-evo', 1, 'cucchiaino'],
  ]),
  recipe('venere-gamberi', 'pranzo', 'Riso venere con gamberi e zucchine', 'Black rice with prawns and courgettes', [
    ['riso-venere', 70],
    ['gamberi', 150],
    ['zucchine', 150],
    ['olio-evo', 1, 'cucchiaio'],
  ]),
  recipe('lenticchie-patate', 'pranzo', 'Lenticchie e patate al forno', 'Lentils and roast potatoes', [
    ['lenticchie', 150],
    ['patate', 200],
    ['insalata', 80],
    ['olio-evo', 1, 'cucchiaio'],
  ]),
  recipe('poke-salmone', 'pranzo', 'Poke di salmone', 'Salmon poke', [
    ['riso-basmati', 70],
    ['salmone', 100],
    ['edamame', 50],
    ['avocado', 40],
  ]),
  recipe('couscous-feta', 'pranzo', 'Couscous con verdure e feta', 'Couscous with vegetables and feta', [
    ['couscous', 70],
    ['verdure', 200],
    ['feta', 40],
    ['olio-evo', 1, 'cucchiaino'],
  ]),
  recipe('pasta-fagioli', 'pranzo', 'Pasta e fagioli', 'Pasta and beans', [
    ['pasta', 60],
    ['borlotti', 150],
    ['passata', 50],
    ['olio-evo', 1, 'cucchiaino'],
  ]),

  // Cena
  recipe('salmone-quinoa', 'cena', 'Salmone con quinoa e broccoli', 'Salmon with quinoa and broccoli', [
    ['salmone', 130, 'g', ['orata o branzino', 'sea bream or sea bass']],
    ['quinoa', 50],
    ['broccoli', 200],
    ['olio-evo', 1, 'cucchiaino'],
  ]),
  recipe('tacchino-patate', 'cena', 'Tacchino con patate al forno', 'Turkey with roast potatoes', [
    ['tacchino', 130],
    ['patate', 200],
    ['insalata', 80],
    ['olio-evo', 1, 'cucchiaio'],
  ]),
  recipe('merluzzo-broccoli', 'cena', 'Merluzzo con broccoli', 'Cod with broccoli', [
    ['merluzzo', 180, 'g', ['branzino', 'sea bass']],
    ['broccoli', 200],
    ['pane-integrale', 40],
    ['olio-evo', 1, 'cucchiaio'],
  ]),
  recipe('frittata-verdure', 'cena', 'Frittata di zucchine', 'Courgette frittata', [
    ['uova', 2, 'pz'],
    ['zucchine', 200],
    ['pane-integrale', 40],
    ['olio-evo', 1, 'cucchiaino'],
  ]),
  recipe('tofu-riso', 'cena', 'Tofu con verdure e riso basmati', 'Tofu with vegetables and basmati rice', [
    ['tofu', 150],
    ['verdure', 200],
    ['riso-basmati', 60],
    ['olio-evo', 1, 'cucchiaino'],
  ]),
  recipe('orata-verdure', 'cena', 'Orata con verdure e patate', 'Sea bream with vegetables and potatoes', [
    ['orata', 200],
    ['verdure', 200],
    ['patate', 120],
    ['olio-evo', 1, 'cucchiaio'],
  ]),
  recipe('zuppa-legumi', 'cena', 'Zuppa di legumi con crostini', 'Bean soup with croutons', [
    ['lenticchie', 100],
    ['ceci', 100],
    ['pane-integrale', 40],
    ['olio-evo', 1, 'cucchiaino'],
  ]),
  recipe('caprese', 'cena', 'Caprese con pane integrale', 'Caprese with wholemeal bread', [
    ['mozzarella', 1, 'pz', ['ricotta (120 g)', 'ricotta (120 g)']],
    ['pomodori', 200],
    ['pane-integrale', 50],
    ['olio-evo', 1, 'cucchiaino'],
  ]),
];

export const recipeIsVeg = (r) => r.items.every(([id]) => FOOD_BY_ID[id]?.veg !== false);

/** Ricette adatte a un tipo di pasto (spuntino e merenda si scambiano le idee). */
export function recipesFor(type) {
  const kinds = type === 'spuntino' || type === 'merenda' ? ['spuntino', 'merenda'] : [type];
  return RECIPES.filter((r) => kinds.includes(r.type));
}

/**
 * Alimenti di una ricetta, pronti per un pasto: { name, food, quantity, unit, alternative, kcal, protein, carbs, fat }.
 * lang: 'it' o 'en'; scale: moltiplica le quantità (per avvicinarsi a un obiettivo calorico).
 */
export function recipeItems(r, { lang = 'it', scale = 1 } = {}) {
  return r.items.map(([id, qty, unit, alternative]) => {
    const f = FOOD_BY_ID[id];
    const u = unit ?? f.unit;
    const quantity = scaleQuantity(qty, u, scale);
    return {
      name: lang === 'en' ? f.en : f.it,
      food: f.id,
      quantity,
      unit: u,
      alternative: alternative ? (lang === 'en' ? alternative[1] : alternative[0]) : '',
      ...nutritionOf(f, quantity, u),
    };
  });
}

/** Quantità arrotondata in modo sensato per l'unità (multipli di 5 g, pezzi interi, ecc.). */
export function scaleQuantity(qty, unit, scale) {
  if (scale === 1) return qty;
  if (unit === 'g' || unit === 'ml') return Math.max(5, Math.round((qty * scale) / 5) * 5);
  if (unit === 'pz' || unit === 'fetta') return Math.max(1, Math.round(qty * scale)); // pezzi interi (niente mezzo uovo)
  return qty; // cucchiai e simili restano uguali
}

// Modelli di piano: una settimana intera da personalizzare

export const DEFAULT_TIMES = {
  colazione: ['07:00', '08:00'],
  spuntino: ['10:30', '11:00'],
  pranzo: ['13:00', '14:00'],
  merenda: ['16:30', '17:00'],
  cena: ['20:00', '21:00'],
};

export const PLAN_TEMPLATES = [
  { id: 'mediterraneo', it: 'Mediterraneo bilanciato', en: 'Balanced Mediterranean', meals: ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'], kcal: 1800 },
  { id: 'ipocalorico', it: 'Ipocalorico', en: 'Low calorie', meals: ['colazione', 'pranzo', 'merenda', 'cena'], kcal: 1500 },
  { id: 'sportivo', it: 'Sportivo', en: 'Athletic', meals: ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'], kcal: 2200 },
  { id: 'vegetariano', it: 'Vegetariano', en: 'Vegetarian', meals: ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'], kcal: 1800, veg: true },
];

const sumKcal = (items) => items.reduce((s, i) => s + (i.kcal ?? 0), 0);

/**
 * Giorni generati da un modello: [{ dayIndex, meals: [{ type, start, end, items }] }].
 * Le porzioni vengono adattate perché ogni giorno si avvicini all'obiettivo calorico (kcal);
 * offset fa partire la rotazione delle ricette da un punto diverso (menù diversi con lo stesso modello).
 */
export function buildTemplateDays(template, { days = 7, kcal = template.kcal, lang = 'it', offset = 0 } = {}) {
  return Array.from({ length: days }, (_, i) => {
    const picks = template.meals.map((type, j) => {
      const options = recipesFor(type).filter((r) => !template.veg || recipeIsVeg(r));
      return { type, recipe: options[(i * 3 + j + offset) % options.length] };
    });
    const base = sumKcal(picks.flatMap((p) => recipeItems(p.recipe)));
    const scale = kcal && base ? Math.min(1.5, Math.max(0.65, kcal / base)) : 1;
    return {
      dayIndex: i + 1,
      meals: picks.map(({ type, recipe: r }) => ({
        type,
        start: DEFAULT_TIMES[type][0],
        end: DEFAULT_TIMES[type][1],
        items: recipeItems(r, { lang, scale }),
      })),
    };
  });
}
