import {
  GROCERY_CATEGORIES,
  inferGroceryCategory,
  normalizeGroceryItemName
} from './grocery-categories';

describe('grocery categories', () => {
  it('includes beverages in the canonical category order', () => {
    expect(GROCERY_CATEGORIES).toContain('Beverages');
  });

  it('recognizes common beverage names', () => {
    expect(inferGroceryCategory('white grape juice')).toBe('Beverages');
    expect(inferGroceryCategory('water')).toBe('Beverages');
    expect(inferGroceryCategory('sparkling water')).toBe('Beverages');
    expect(inferGroceryCategory('pop')).toBe('Beverages');
    expect(inferGroceryCategory('orange pop')).toBe('Beverages');
    expect(inferGroceryCategory('soda')).toBe('Beverages');
    expect(inferGroceryCategory('orange soda')).toBe('Beverages');
    expect(inferGroceryCategory('Coke')).toBe('Beverages');
    expect(inferGroceryCategory('Diet Coke')).toBe('Beverages');
    expect(inferGroceryCategory('Sprite - 5 12pks')).toBe('Beverages');
  });

  it('does not classify similarly named food and household items as beverages', () => {
    expect(inferGroceryCategory('water chestnuts')).not.toBe('Beverages');
    expect(inferGroceryCategory('cake pop')).not.toBe('Beverages');
    expect(inferGroceryCategory('baking soda')).toBe('Baking');
    expect(inferGroceryCategory('washing soda')).not.toBe('Beverages');
    expect(inferGroceryCategory('soda bread')).not.toBe('Beverages');
  });

  it('keeps a specific known category and refines catch-all categories', () => {
    expect(inferGroceryCategory('iced tea', 'Snacks & Breakfast')).toBe('Snacks & Breakfast');
    expect(inferGroceryCategory('iced tea', 'Pantry & Other')).toBe('Beverages');
  });

  it('uses household preferences before catalog and ingredient categories', () => {
    expect(inferGroceryCategory('milk', 'Dairy & Eggs', 'Beverages')).toBe('Beverages');
  });

  it('normalizes package quantities without treating product numbers as quantities', () => {
    expect(normalizeGroceryItemName('Sprite - 5 12pks')).toBe('sprite');
    expect(normalizeGroceryItemName('Chicken breasts 2 lb')).toBe('chicken breasts');
    expect(normalizeGroceryItemName('7 Up')).toBe('7 up');
  });

  it('uses the local catalog for grocery and household aliases', () => {
    expect(inferGroceryCategory('dish soap')).toBe('Household');
    expect(inferGroceryCategory('avocados')).toBe('Produce');
  });
});
