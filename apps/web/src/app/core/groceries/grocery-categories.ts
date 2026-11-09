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
const BEVERAGE_TERM = /\b(beer|beverage|cider|coffee|coke|cola|drink|juice|kombucha|lemonade|seltzer|tea|wine)\b/i;
const SODA_BEVERAGE = /\bsoda\b/i;
const NON_BEVERAGE_SODA = /\b(?:baking|washing)\s+soda\b|\bsoda\s+bread\b/i;
const POP_BEVERAGE = /^(?:(?:cherry|cream|diet|grape|orange|root beer)\s+)?pop$/i;
const WATER_BEVERAGE = /^(?:(?:bottled|coconut|flavored|flavoured|mineral|sparkling|tonic)\s+)?water$/i;

export function inferGroceryCategory(name: string, knownCategory?: string | null): string {
  const category = knownCategory?.trim() ?? '';
  if (category && !CATCH_ALL_CATEGORIES.has(category)) return category;

  const normalizedName = name.trim().replace(/\s+/g, ' ');
  const isSoda = SODA_BEVERAGE.test(normalizedName) && !NON_BEVERAGE_SODA.test(normalizedName);
  if (
    BEVERAGE_TERM.test(normalizedName) ||
    isSoda ||
    POP_BEVERAGE.test(normalizedName) ||
    WATER_BEVERAGE.test(normalizedName)
  ) {
    return 'Beverages';
  }

  return category || 'Other';
}
