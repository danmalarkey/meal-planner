import { GROCERY_CATEGORY_ALIAS_GROUPS } from './grocery-catalog.generated';

export const GROCERY_CATEGORIES = [
  'Produce',
  'Meat & Poultry',
  'Seafood',
  'Dairy & Eggs',
  'Dairy & Alternatives',
  'Bakery & Bread',
  'Pasta, Rice & Grains',
  'Canned & Jarred',
  'Condiments & Sauces',
  'Spices & Seasonings',
  'Baking',
  'Nuts, Seeds & Dried Fruit',
  'Frozen',
  'Snacks & Breakfast',
  'Beverages',
  'Pantry & Other',
  'Household',
  'Other'
] as const;

const CATCH_ALL_CATEGORIES = new Set(['', 'Other', 'Pantry & Other']);
const LOCAL_CATEGORY_OVERRIDES = new Map<string, string>([
  ['baking soda', 'Baking'],
  ['sprite', 'Beverages']
]);
const CATALOG_CATEGORY_BY_ALIAS = new Map<string, string>(
  GROCERY_CATEGORY_ALIAS_GROUPS.flatMap(([category, aliases]) =>
    aliases.split('\n').map((alias) => [alias, category] as const)
  )
);
const BEVERAGE_TERM = /\b(beer|beverage|cider|coffee|coke|cola|drink|juice|kombucha|lemonade|seltzer|tea|wine)\b/i;
const SODA_BEVERAGE = /\bsoda\b/i;
const NON_BEVERAGE_SODA = /\b(?:baking|washing)\s+soda\b|\bsoda\s+bread\b/i;
const POP_BEVERAGE = /^(?:(?:cherry|cream|diet|grape|orange|root beer)\s+)?pop$/i;
const WATER_BEVERAGE = /^(?:(?:bottled|coconut|flavored|flavoured|mineral|sparkling|tonic)\s+)?water$/i;
const PACKAGING_SUFFIX = /\s+[-–—]\s+(?:\d+(?:\.\d+)?\s*)+(?:packs?|pks?|cases?|cans?|bottles?|boxes?|ct|count|oz|fl\s*oz|lb|lbs|g|kg|ml|l)?\s*$/i;
const TRAILING_SIZE = /\s+(?:\d+\s+)?\d+(?:\.\d+)?\s*(?:packs?|pks?|cases?|cans?|bottles?|boxes?|ct|count|oz|fl\s*oz|lb|lbs|g|kg|ml|l)\s*$/i;

export function normalizeGroceryItemName(name: string): string {
  return name
    .replace(PACKAGING_SUFFIX, '')
    .replace(TRAILING_SIZE, '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function inferGroceryCategory(
  name: string,
  knownCategory?: string | null,
  preferredCategory?: string | null
): string {
  const preference = preferredCategory?.trim() ?? '';
  if (preference) return preference;

  const category = knownCategory?.trim() ?? '';
  if (category && !CATCH_ALL_CATEGORIES.has(category)) return category;

  const normalizedName = normalizeGroceryItemName(name);
  const localOverride = LOCAL_CATEGORY_OVERRIDES.get(normalizedName);
  if (localOverride) return localOverride;

  const isSoda = SODA_BEVERAGE.test(normalizedName) && !NON_BEVERAGE_SODA.test(normalizedName);
  if (
    BEVERAGE_TERM.test(normalizedName) ||
    isSoda ||
    POP_BEVERAGE.test(normalizedName) ||
    WATER_BEVERAGE.test(normalizedName)
  ) {
    return 'Beverages';
  }

  const catalogCategory = catalogCategoryFor(normalizedName);
  if (catalogCategory) return catalogCategory;

  return category || 'Other';
}

function catalogCategoryFor(normalizedName: string): string | null {
  const exact = LOCAL_CATEGORY_OVERRIDES.get(normalizedName) ?? CATALOG_CATEGORY_BY_ALIAS.get(normalizedName);
  if (exact) return exact;

  const words = normalizedName.split(' ').filter(Boolean);
  for (let length = Math.min(words.length, 5); length > 0; length -= 1) {
    for (let start = 0; start <= words.length - length; start += 1) {
      const phrase = words.slice(start, start + length).join(' ');
      const category = LOCAL_CATEGORY_OVERRIDES.get(phrase) ?? CATALOG_CATEGORY_BY_ALIAS.get(phrase);
      if (category) return category;
    }
  }

  return null;
}
