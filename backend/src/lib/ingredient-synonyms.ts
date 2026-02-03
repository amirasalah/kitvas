/**
 * Ingredient Synonym Mapping & Normalization
 *
 * Week 5: ML Models & Improvement
 *
 * Maps ingredient variations (plurals, misspellings, alternate names)
 * to their canonical normalized form.
 */

/**
 * Canonical ingredient name -> list of synonyms/variations
 * The key is the normalized name stored in the database.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  // Proteins
  chicken: ['chickens', 'chiken', 'chikken'],
  beef: ['beefs', 'ground beef', 'beef steak', 'steak'],
  pork: ['porks', 'pork chop', 'pork loin'],
  salmon: ['salmons', 'salmon fillet', 'salmon filet'],
  tuna: ['tunas', 'tuna steak', 'ahi tuna'],
  shrimp: ['shrimps', 'prawns', 'prawn', 'king prawn'],
  tofu: ['tofus', 'bean curd', 'beancurd'],
  tempeh: ['tempehs', 'tempe'],
  egg: ['eggs', 'egg yolk', 'egg white', 'yolk', 'yolks'],
  lamb: ['lambs', 'lamb chop'],
  turkey: ['turkeys', 'turkey breast'],
  duck: ['ducks', 'duck breast'],
  fish: ['fishes'],
  cod: ['cods', 'cod fillet'],
  tilapia: ['tilapias'],
  crab: ['crabs', 'crabmeat', 'crab meat'],
  lobster: ['lobsters'],
  scallop: ['scallops'],
  anchovy: ['anchovies', 'anchovi'],
  sardine: ['sardines'],
  bacon: ['bacons'],
  sausage: ['sausages'],
  ham: ['hams'],

  // Vegetables
  tomato: ['tomatoes', 'tomatoe', 'cherry tomato', 'cherry tomatoes', 'roma tomato', 'sun-dried tomato', 'sun dried tomato', 'sundried tomato'],
  onion: ['onions', 'red onion', 'red onions', 'white onion', 'yellow onion', 'sweet onion', 'shallot', 'shallots'],
  garlic: ['garlics', 'garlic clove', 'garlic cloves'],
  ginger: ['gingers', 'fresh ginger', 'ginger root'],
  carrot: ['carrots'],
  celery: ['celeries', 'celery stalk', 'celery stalks'],
  'bell pepper': ['bell peppers', 'red pepper', 'green pepper', 'yellow pepper', 'red bell pepper', 'green bell pepper', 'capsicum'],
  mushroom: ['mushrooms', 'shiitake', 'shiitake mushroom', 'portobello', 'cremini', 'button mushroom', 'oyster mushroom', 'enoki'],
  spinach: ['spinachs', 'baby spinach'],
  kale: ['kales', 'curly kale', 'lacinato kale'],
  broccoli: ['broccolis', 'brocoli', 'brocolli'],
  cauliflower: ['cauliflowers', 'cauliflour'],
  zucchini: ['zucchinis', 'courgette', 'courgettes'],
  eggplant: ['eggplants', 'aubergine', 'aubergines'],
  potato: ['potatoes', 'potatoe', 'sweet potato', 'sweet potatoes', 'yukon gold'],
  corn: ['corns', 'sweet corn', 'sweetcorn', 'corn on the cob'],
  pea: ['peas', 'green pea', 'green peas', 'snap pea', 'snow pea'],
  cucumber: ['cucumbers', 'english cucumber'],
  lettuce: ['lettuces', 'romaine', 'iceberg', 'butter lettuce'],
  cabbage: ['cabbages', 'red cabbage', 'napa cabbage', 'chinese cabbage'],
  asparagus: ['asparaguses'],
  'green bean': ['green beans', 'french bean', 'french beans', 'string bean', 'string beans'],
  avocado: ['avocados', 'avacado', 'avacados'],
  artichoke: ['artichokes'],
  beet: ['beets', 'beetroot', 'beetroots'],
  radish: ['radishes', 'daikon', 'daikon radish'],
  'brussels sprout': ['brussels sprouts', 'brussel sprout', 'brussel sprouts'],
  leek: ['leeks'],
  fennel: ['fennels'],
  okra: ['okras'],
  turnip: ['turnips'],
  squash: ['squashes', 'butternut squash', 'acorn squash', 'spaghetti squash', 'kabocha'],

  // Fruits
  lemon: ['lemons', 'lemon juice', 'lemon zest'],
  lime: ['limes', 'lime juice', 'lime zest'],
  orange: ['oranges', 'orange juice', 'orange zest'],
  apple: ['apples'],
  banana: ['bananas'],
  mango: ['mangoes', 'mangos'],
  pineapple: ['pineapples'],
  strawberry: ['strawberries'],
  blueberry: ['blueberries'],
  raspberry: ['raspberries'],
  coconut: ['coconuts'],
  grape: ['grapes'],
  peach: ['peaches'],
  pear: ['pears'],
  cherry: ['cherries'],
  watermelon: ['watermelons'],
  kiwi: ['kiwis', 'kiwifruit'],
  pomegranate: ['pomegranates'],
  fig: ['figs'],
  date: ['dates', 'medjool date', 'medjool dates'],
  cranberry: ['cranberries'],
  plum: ['plums'],
  apricot: ['apricots'],

  // Herbs & Spices
  basil: ['basils', 'fresh basil', 'thai basil'],
  oregano: ['oreganos'],
  thyme: ['thymes', 'fresh thyme'],
  rosemary: ['rosemarys', 'fresh rosemary'],
  parsley: ['parsleys', 'flat leaf parsley', 'italian parsley'],
  cilantro: ['cilantros', 'coriander leaf', 'fresh coriander'],
  mint: ['mints', 'fresh mint', 'peppermint', 'spearmint'],
  dill: ['dills', 'fresh dill'],
  sage: ['sages', 'fresh sage'],
  chive: ['chives', 'fresh chives'],
  tarragon: ['tarragons'],
  bay: ['bay leaf', 'bay leaves'],
  cumin: ['cumins', 'ground cumin', 'cumin seed', 'cumin seeds'],
  coriander: ['corianders', 'ground coriander', 'coriander seed', 'coriander seeds'],
  paprika: ['paprikas', 'smoked paprika', 'sweet paprika', 'hot paprika'],
  turmeric: ['turmerics', 'ground turmeric', 'tumeric'],
  cinnamon: ['cinnamons', 'ground cinnamon', 'cinnamon stick', 'cinnamon sticks'],
  nutmeg: ['nutmegs', 'ground nutmeg'],
  clove: ['cloves', 'ground cloves'],
  'black pepper': ['black peppers', 'pepper', 'ground pepper', 'peppercorn', 'peppercorns'],
  'chili flake': ['chili flakes', 'red pepper flakes', 'crushed red pepper', 'chilli flakes', 'chile flakes'],
  'chili powder': ['chili powders', 'chile powder', 'chilli powder'],
  cayenne: ['cayenne pepper', 'ground cayenne'],
  cardamom: ['cardamoms', 'green cardamom'],
  'star anise': ['star anises'],
  saffron: ['saffrons'],
  'curry powder': ['curry powders'],
  garam: ['garam masala'],

  // Condiments & Sauces
  miso: ['misos', 'miso paste', 'white miso', 'red miso'],
  gochujang: ['gochujangs', 'korean chili paste'],
  'soy sauce': ['soy sauces', 'shoyu', 'tamari', 'light soy sauce', 'dark soy sauce', 'soysauce', 'soya sauce'],
  tahini: ['tahinis', 'sesame paste'],
  harissa: ['harissas', 'harissa paste'],
  sriracha: ['srirachas'],
  mayonnaise: ['mayo', 'mayonaise'],
  mustard: ['mustards', 'dijon', 'dijon mustard', 'whole grain mustard', 'yellow mustard'],
  ketchup: ['ketchups', 'catsup'],
  vinegar: ['vinegars', 'apple cider vinegar', 'white vinegar', 'red wine vinegar', 'balsamic vinegar', 'rice vinegar', 'sherry vinegar'],
  'fish sauce': ['fish sauces', 'nam pla', 'fishsauce'],
  'oyster sauce': ['oyster sauces', 'oystersauce'],
  'hoisin sauce': ['hoisin sauces', 'hoisin', 'hoisinsauce'],
  'worcestershire sauce': ['worcestershire', 'worcester sauce'],
  'hot sauce': ['hot sauces', 'tabasco', 'hotsauce'],
  pesto: ['pestos', 'basil pesto'],
  'tomato paste': ['tomato pastes', 'tomato puree', 'tomato purée'],
  'tomato sauce': ['tomato sauces', 'marinara', 'marinara sauce'],
  salsa: ['salsas'],
  'coconut aminos': [],
  honey: ['honeys', 'raw honey'],
  'maple syrup': ['maple syrups'],
  'brown sugar': ['brown sugars'],
  sugar: ['sugars', 'white sugar', 'granulated sugar', 'caster sugar', 'castor sugar'],

  // Dairy
  butter: ['butters', 'unsalted butter', 'salted butter'],
  cheese: ['cheeses'],
  parmesan: ['parmesans', 'parmesan cheese', 'parmigiano', 'parmigiano reggiano', 'parmigiano-reggiano'],
  mozzarella: ['mozzarellas', 'mozzarella cheese', 'fresh mozzarella'],
  cheddar: ['cheddars', 'cheddar cheese', 'sharp cheddar'],
  feta: ['fetas', 'feta cheese'],
  'goat cheese': ['goat cheeses', 'chevre', 'chèvre'],
  'cream cheese': ['cream cheeses', 'philadelphia'],
  ricotta: ['ricottas', 'ricotta cheese'],
  cream: ['creams', 'heavy cream', 'whipping cream', 'double cream', 'single cream', 'heavy whipping cream'],
  'sour cream': ['sour creams'],
  milk: ['milks', 'whole milk', 'skim milk', '2% milk'],
  yogurt: ['yogurts', 'yoghurt', 'yoghurts', 'greek yogurt', 'greek yoghurt', 'plain yogurt'],

  // Grains & Starches
  pasta: ['pastas', 'spaghetti', 'penne', 'fusilli', 'rigatoni', 'linguine', 'fettuccine', 'farfalle', 'macaroni', 'orzo', 'tagliatelle'],
  rice: ['rices', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'sticky rice', 'sushi rice', 'arborio rice'],
  noodle: ['noodles', 'ramen', 'udon', 'soba', 'rice noodle', 'rice noodles', 'egg noodle', 'egg noodles', 'glass noodle'],
  bread: ['breads', 'sourdough', 'ciabatta', 'focaccia', 'baguette', 'pita', 'naan', 'tortilla'],
  flour: ['flours', 'all-purpose flour', 'all purpose flour', 'plain flour', 'bread flour', 'cake flour', 'wheat flour'],
  quinoa: ['quinoas'],
  couscous: ['couscouses'],
  oat: ['oats', 'rolled oats', 'oatmeal', 'steel cut oats'],
  barley: ['barleys', 'pearl barley'],
  bulgur: ['bulgurs', 'bulgar', 'bulgur wheat'],
  polenta: ['polentas', 'cornmeal'],
  'panko breadcrumb': ['panko', 'panko breadcrumbs', 'breadcrumbs', 'bread crumbs'],

  // Oils & Fats
  'olive oil': ['olive oils', 'extra virgin olive oil', 'evoo', 'oliveoil'],
  'coconut oil': ['coconut oils', 'coconutoil'],
  'sesame oil': ['sesame oils', 'toasted sesame oil', 'sesameoil'],
  'avocado oil': ['avocado oils'],
  'vegetable oil': ['vegetable oils', 'canola oil', 'rapeseed oil', 'sunflower oil'],

  // Legumes
  chickpea: ['chickpeas', 'garbanzo', 'garbanzos', 'garbanzo bean', 'garbanzo beans'],
  'black bean': ['black beans', 'frijoles negros'],
  'kidney bean': ['kidney beans', 'red kidney bean'],
  lentil: ['lentils', 'red lentil', 'red lentils', 'green lentil', 'brown lentil'],
  edamame: ['edamames'],
  'white bean': ['white beans', 'cannellini', 'cannellini bean', 'cannellini beans', 'great northern bean'],
  'pinto bean': ['pinto beans'],
  'navy bean': ['navy beans'],

  // Nuts & Seeds
  almond: ['almonds', 'almond flour', 'ground almonds', 'sliced almonds', 'slivered almonds'],
  walnut: ['walnuts'],
  cashew: ['cashews', 'cashew nut', 'cashew nuts'],
  peanut: ['peanuts', 'peanut butter', 'peanutbutter'],
  'sesame seed': ['sesame seeds', 'sesame'],
  'pumpkin seed': ['pumpkin seeds', 'pepitas'],
  'sunflower seed': ['sunflower seeds'],
  'pine nut': ['pine nuts', 'pignoli'],
  pistachio: ['pistachios'],
  pecan: ['pecans'],
  hazelnut: ['hazelnuts', 'filbert'],
  'chia seed': ['chia seeds', 'chia'],
  'flax seed': ['flax seeds', 'flaxseed', 'flaxseeds', 'linseed', 'linseeds'],
  'hemp seed': ['hemp seeds', 'hemp heart', 'hemp hearts'],

  // Middle Eastern / Turkish
  kofte: ['kofta', 'köfte', 'kufte', 'kufta', 'kefte', 'kifta'],
  hummus: ['humus', 'houmous', 'hommus'],
  falafel: ['felafel', 'falafil'],
  shawarma: ['shawerma', 'shwarma', 'shoarma'],
  'baba ganoush': ['baba ghanoush', 'baba ghanouj', 'baba ganouj'],
  labneh: ['labne', 'labaneh', 'labni'],
  "za'atar": ['zaatar', 'zatar', 'zahtar'],
  sumac: ['sumak', 'sumaq'],
  halloumi: ['haloumi', 'hallumi'],
  kibbeh: ['kibbe', 'kubbeh', 'kubbe'],
  fattoush: ['fattush', 'fatoush'],
  tzatziki: ['tsatsiki', 'tzaziki', 'zaziki'],
  gyro: ['gyros', 'yiro', 'yiros'],
  pita: ['pitta', 'pita bread'],

  // Asian
  gochugaru: ['gochukaru', 'kochugaru', 'korean red pepper flakes'],
  doenjang: ['doenjung', 'dwenjang'],
  bulgogi: ['bulkogi', 'bulgoki'],
  bibimbap: ['bibimbop', 'bi bim bap'],
  teriyaki: ['teryaki', 'teriyaky'],
  'char siu': ['charsiu', 'char siew', 'cha siu'],
  dashi: ['dashis'],
  mirin: ['mirins'],
  sake: ['sakes', 'cooking sake'],
  bonito: ['bonito flakes', 'katsuobushi'],
  nori: ['noris', 'seaweed sheets'],
  wakame: ['wakames'],
  kombu: ['kombus', 'kelp'],

  // Indian
  paneer: ['panir', 'paner', 'indian cheese'],
  biryani: ['biriyani', 'briyani', 'byriani'],
  tikka: ['tikha', 'teeka'],
  masala: ['marsala', 'massala'],
  korma: ['kurma', 'qorma'],
  vindaloo: ['vindalu', 'vindalho'],
  samosa: ['samusa', 'samoosa'],
  naan: ['nan', 'nann', 'naan bread'],
  ghee: ['gee', 'ghi', 'clarified butter'],
  'garam masala': ['garam marsala', 'garum masala'],
  tandoori: ['tandori'],
  chutney: ['chutneys'],
  dal: ['daal', 'dhal', 'lentil curry'],
  raita: ['raitas'],
  pakora: ['pakoras', 'bhaji', 'bhajis'],

  // Latin American
  quesadilla: ['quesadila', 'quesidilla'],
  guacamole: ['guacamoli', 'guacamle', 'guac'],
  jalapeno: ['jalapeño', 'halapeno', 'jalepeno'],
  chipotle: ['chipotl', 'chiptole'],
  queso: ['keso'],
  tortilla: ['tortila', 'tortiya', 'tortillas'],
  burrito: ['burito', 'buritto', 'burritos'],
  enchilada: ['enchilata', 'enchildada', 'enchiladas'],
  mole: ['molé', 'molay'],
  taco: ['tacos'],
  tamale: ['tamales'],
  elote: ['elotes', 'mexican street corn'],
  'pico de gallo': ['pico', 'salsa fresca'],
  'refried beans': ['frijoles refritos'],
  carnitas: ['carnita'],
  chorizo: ['chorizos'],
  plantain: ['plantains', 'platano', 'platanos'],

  // Italian
  bruschetta: ['bruchetta', 'brushetta'],
  focaccia: ['focacia', 'foccacia'],
  gnocchi: ['gnochi', 'nochi'],
  prosciutto: ['proscuito', 'prosciuto'],
  pancetta: ['pancettas'],
  risotto: ['risottos'],
  arancini: ['arancinis'],
  'balsamic glaze': ['balsamic reduction'],
  mascarpone: ['mascarpones'],
  gorgonzola: ['gorgonzolas'],

  // General International
  barbecue: ['barbeque', 'bbq', 'bar-b-q'],
  acai: ['açaí', 'acaí', 'assai'],

  // Other
  chocolate: ['chocolates', 'dark chocolate', 'milk chocolate', 'white chocolate', 'cocoa', 'cacao', 'cocoa powder'],
  vanilla: ['vanillas', 'vanilla extract', 'vanilla bean', 'vanilla essence'],
  'coconut milk': ['coconut milks', 'coconut cream', 'coconutmilk'],
  'almond milk': ['almond milks'],
  'oat milk': ['oat milks'],
  'nutritional yeast': ['nutritional yeasts', 'nooch'],
  kimchi: ['kimchis', 'kimchee'],
  sauerkraut: ['sauerkrauts'],
  pickle: ['pickles', 'pickled', 'gherkin', 'gherkins'],
  caper: ['capers'],
  olive: ['olives', 'black olive', 'black olives', 'green olive', 'green olives', 'kalamata'],
  salt: ['salts', 'sea salt', 'kosher salt', 'flaky salt', 'himalayan salt'],
  'baking powder': ['baking powders'],
  'baking soda': ['baking sodas', 'bicarbonate of soda', 'bicarb'],
  yeast: ['yeasts', 'active dry yeast', 'instant yeast'],
  gelatin: ['gelatins', 'gelatine'],
  cornstarch: ['cornstarches', 'corn starch', 'cornflour', 'corn flour'],
  'soy milk': ['soy milks', 'soymilk'],
};

/**
 * Build a reverse lookup map: synonym -> canonical name
 */
function buildReverseLookup(): Map<string, string> {
  const map = new Map<string, string>();

  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    // Map the canonical name to itself
    map.set(canonical, canonical);

    // Map each synonym to the canonical name
    for (const syn of synonyms) {
      map.set(syn.toLowerCase(), canonical);
    }
  }

  return map;
}

const reverseLookup = buildReverseLookup();

/**
 * Normalize an ingredient name to its canonical form.
 *
 * Steps:
 * 1. Lowercase and trim
 * 2. Remove extra whitespace
 * 3. Check synonym map for exact match
 * 4. Handle common plural forms
 * 5. Strip common qualifiers ("fresh", "dried", "ground", etc.)
 */
export function normalizeIngredient(name: string): string {
  let normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');

  // Direct synonym lookup
  const canonical = reverseLookup.get(normalized);
  if (canonical) return canonical;

  // Strip common qualifiers and try again
  const qualifiers = [
    'fresh ', 'dried ', 'dry ', 'ground ', 'crushed ', 'chopped ',
    'diced ', 'minced ', 'sliced ', 'grated ', 'shredded ', 'frozen ',
    'canned ', 'roasted ', 'toasted ', 'smoked ', 'raw ', 'cooked ',
    'organic ', 'extra virgin ', 'light ', 'dark ', 'hot ', 'cold ',
    'large ', 'small ', 'medium ', 'whole ', 'half ', 'baby ',
  ];

  for (const q of qualifiers) {
    if (normalized.startsWith(q)) {
      const stripped = normalized.slice(q.length);
      const found = reverseLookup.get(stripped);
      if (found) return found;
    }
  }

  // Handle plurals: try removing trailing 's', 'es', 'ies' -> 'y'
  if (normalized.endsWith('ies')) {
    const singular = normalized.slice(0, -3) + 'y';
    const found = reverseLookup.get(singular);
    if (found) return found;
  }
  if (normalized.endsWith('es')) {
    const singular = normalized.slice(0, -2);
    const found = reverseLookup.get(singular);
    if (found) return found;
  }
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    const singular = normalized.slice(0, -1);
    const found = reverseLookup.get(singular);
    if (found) return found;
  }

  // If no match found, return the cleaned-up version
  // Remove trailing 's' for basic plural handling
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Check if two ingredient names refer to the same ingredient
 */
export function isSameIngredient(name1: string, name2: string): boolean {
  return normalizeIngredient(name1) === normalizeIngredient(name2);
}

/**
 * Get all known synonyms for a canonical ingredient name
 */
export function getSynonyms(canonicalName: string): string[] {
  return SYNONYM_MAP[canonicalName] || [];
}

/**
 * Get all canonical ingredient names
 */
export function getAllCanonicalNames(): string[] {
  return Object.keys(SYNONYM_MAP);
}

/**
 * Search for ingredients matching a partial query
 * Returns canonical names that match the query (either directly or via synonyms)
 */
export function getSynonymMatches(query: string, limit = 10): string[] {
  const matches: string[] = [];
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return matches;

  // First pass: exact prefix matches on canonical names (higher priority)
  for (const canonical of Object.keys(SYNONYM_MAP)) {
    if (canonical.startsWith(lowerQuery)) {
      matches.push(canonical);
    }
    if (matches.length >= limit) return matches;
  }

  // Second pass: contains matches on canonical names
  for (const canonical of Object.keys(SYNONYM_MAP)) {
    if (!matches.includes(canonical) && canonical.includes(lowerQuery)) {
      matches.push(canonical);
    }
    if (matches.length >= limit) return matches;
  }

  // Third pass: check synonyms
  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (matches.includes(canonical)) continue;

    for (const synonym of synonyms) {
      if (synonym.toLowerCase().includes(lowerQuery)) {
        matches.push(canonical);
        break;
      }
    }
    if (matches.length >= limit) return matches;
  }

  return matches;
}
