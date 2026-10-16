// Piatti pronti da inserire nei piani alimentari con un clic (valori indicativi per porzione).
// kcal = calorie; p / c / f = proteine / carboidrati / grassi in grammi; veg = adatto a vegetariani.

const dish = (type, name, description, kcal, p, c, f, veg = false) => ({ type, name, description, kcal, protein: p, carbs: c, fat: f, veg });

export const DISHES = [
  // Colazione
  dish('colazione', "Porridge d'avena con frutti di bosco", 'Fiocchi di avena 50 g, latte parzialmente scremato 200 ml, frutti di bosco 100 g, mandorle 10 g', 380, 15, 55, 11, true),
  dish('colazione', 'Yogurt greco con granola', 'Yogurt greco 0% 170 g, granola senza zuccheri aggiunti 30 g, miele 1 cucchiaino', 340, 22, 42, 8, true),
  dish('colazione', 'Pane integrale con avocado e uovo', 'Pane di segale 60 g, avocado 50 g, uovo in camicia', 400, 17, 38, 20, true),
  dish('colazione', 'Pancake proteici con frutta', 'Albumi 150 g, avena 40 g, banana, fragole fresche', 360, 24, 52, 5, true),
  dish('colazione', 'Smoothie bowl', 'Banana, frutti rossi, latte vegetale, semi di chia 10 g, cocco rapè', 350, 9, 58, 10, true),
  dish('colazione', 'Fette integrali con ricotta e marmellata', 'Fette biscottate integrali 4, ricotta 80 g, marmellata senza zucchero', 320, 14, 46, 9, true),
  dish('colazione', 'Omelette con spinaci', 'Due uova, spinaci, pane di segale tostato 40 g', 390, 22, 24, 22, true),
  dish('colazione', 'Cappuccino e cornetto integrale', 'Cappuccino con latte parzialmente scremato, cornetto integrale', 330, 10, 44, 12, true),
  // Spuntino / merenda
  dish('spuntino', 'Frutta fresca e mandorle', 'Una mela o una pera, mandorle 15 g', 180, 4, 22, 9, true),
  dish('spuntino', 'Yogurt bianco e noci', 'Yogurt bianco 125 g, noci 10 g', 160, 7, 9, 10, true),
  dish('spuntino', 'Gallette di riso con bresaola', 'Gallette di riso 3, bresaola 40 g', 170, 15, 23, 2),
  dish('spuntino', 'Hummus e verdure crude', 'Hummus 50 g, carote e sedano', 150, 5, 14, 8, true),
  dish('spuntino', 'Barretta proteica', 'Barretta proteica da 40 g', 190, 15, 18, 6, true),
  dish('merenda', 'Kefir e frutti di bosco', 'Kefir 200 ml, frutti di bosco 100 g', 170, 8, 22, 5, true),
  dish('merenda', 'Toast integrale con tacchino', 'Pane integrale 50 g, fesa di tacchino 40 g', 210, 16, 25, 4),
  dish('merenda', 'Banana e burro di arachidi', 'Una banana, burro di arachidi 15 g', 210, 5, 29, 9, true),
  dish('merenda', 'Parmigiano e cracker integrali', 'Parmigiano 20 g, cracker integrali 25 g', 190, 10, 17, 9, true),
  // Pranzo
  dish('pranzo', 'Bowl di pollo grigliato', 'Petto di pollo 120 g, quinoa 70 g, verdure di stagione, olio evo 10 g', 560, 42, 58, 16),
  dish('pranzo', 'Insalata di farro e ceci', 'Farro 70 g, ceci 100 g, pomodorini, cetrioli, feta 30 g', 540, 22, 78, 15, true),
  dish('pranzo', 'Pasta integrale al pomodoro', 'Pasta integrale 80 g, pomodoro fresco, basilico, parmigiano 10 g', 480, 18, 80, 9, true),
  dish('pranzo', 'Riso venere con gamberi', 'Riso venere 70 g, gamberi 120 g, zucchine, lime', 520, 30, 68, 12),
  dish('pranzo', 'Burger di lenticchie e patate al forno', 'Burger di lenticchie 120 g, insalata mista, patate 150 g', 570, 24, 82, 15, true),
  dish('pranzo', 'Poke di tonno', 'Riso 70 g, tonno fresco 100 g, edamame, avocado 40 g, sesamo', 590, 36, 66, 19),
  dish('pranzo', 'Couscous di verdure e feta', 'Couscous integrale 70 g, verdure grigliate, feta 40 g', 530, 19, 74, 17, true),
  dish('pranzo', 'Pasta e fagioli', 'Pasta corta 60 g, fagioli borlotti 120 g, rosmarino', 510, 22, 82, 8, true),
  // Cena
  dish('cena', 'Salmone con quinoa e verdure', 'Filetto di salmone 130 g, quinoa 50 g, verdure al vapore', 520, 34, 38, 24),
  dish('cena', 'Tacchino con patate al forno', 'Fesa di tacchino 130 g, patate 200 g, rosmarino', 500, 38, 46, 14),
  dish('cena', 'Zuppa di legumi con crostini', 'Legumi misti 150 g, crostini integrali 40 g', 460, 22, 66, 9, true),
  dish('cena', 'Merluzzo con broccoli', 'Merluzzo 180 g al forno, broccoli, olio evo 10 g, pane 40 g', 430, 38, 30, 14),
  dish('cena', 'Frittata di verdure', 'Uova 2, zucchine, insalata, pane integrale 40 g', 450, 22, 26, 25, true),
  dish('cena', 'Tofu saltato con riso basmati', 'Tofu 150 g, verdure saltate, riso basmati 60 g', 480, 26, 56, 16, true),
  dish('cena', 'Orata al cartoccio', 'Orata 200 g, verdure grigliate, patate 120 g', 470, 40, 30, 18),
  dish('cena', 'Pizza margherita (sgarro)', 'Pizza margherita, insalata mista', 800, 30, 105, 26, true),
];

/** Suggerimenti per un tipo di pasto (spuntino e merenda si scambiano le idee). */
export function dishesFor(type, query = '') {
  const kinds = type === 'spuntino' || type === 'merenda' ? ['spuntino', 'merenda'] : [type];
  const q = query.trim().toLowerCase();
  return DISHES.filter((d) => kinds.includes(d.type) && (!q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)));
}

/** Calorie stimate dai macronutrienti (4 kcal/g proteine e carboidrati, 9 kcal/g grassi). */
export const kcalFromMacros = (p, c, f) => Math.round((p || 0) * 4 + (c || 0) * 4 + (f || 0) * 9);

// Modelli di partenza: per ogni giorno si alternano piatti diversi della libreria.
export const MEAL_TEMPLATES = [
  { id: 'mediterraneo', label: 'Mediterraneo bilanciato', hint: '≈ 1.800 kcal · 5 pasti', meals: ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'], kcal: 1800 },
  { id: 'ipocalorico', label: 'Ipocalorico', hint: '≈ 1.500 kcal · 4 pasti', meals: ['colazione', 'pranzo', 'merenda', 'cena'], kcal: 1500, light: true },
  { id: 'sportivo', label: 'Sportivo', hint: '≈ 2.200 kcal · 5 pasti', meals: ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'], kcal: 2200, rich: true },
  { id: 'vegetariano', label: 'Vegetariano', hint: '≈ 1.800 kcal · 5 pasti', meals: ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'], kcal: 1800, veg: true },
];

/** Giorni (1-7) generati da un modello: [{ dayIndex, meals: [piatto…] }]. */
export function buildTemplateWeek(template) {
  return Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i + 1,
    meals: template.meals.map((type, j) => {
      let options = dishesFor(type).filter((d) => !d.name.includes('sgarro') && (!template.veg || d.veg));
      if (template.light) options = [...options].sort((a, b) => a.kcal - b.kcal).slice(0, Math.max(3, Math.ceil(options.length / 2)));
      if (template.rich) options = [...options].sort((a, b) => b.kcal - a.kcal).slice(0, Math.max(3, Math.ceil(options.length * 0.7)));
      return options[(i * 2 + j) % options.length];
    }).map((d, j) => ({ ...d, type: template.meals[j] })),
  }));
}
