import { GROCERY_CATEGORIES, inferGroceryCategory } from './grocery-categories';

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
  });

  it('does not classify similarly named food and household items as beverages', () => {
    expect(inferGroceryCategory('water chestnuts')).toBe('Other');
    expect(inferGroceryCategory('cake pop')).toBe('Other');
    expect(inferGroceryCategory('baking soda')).toBe('Other');
    expect(inferGroceryCategory('washing soda')).toBe('Other');
    expect(inferGroceryCategory('soda bread')).toBe('Other');
  });

  it('keeps a specific known category and refines catch-all categories', () => {
    expect(inferGroceryCategory('iced tea', 'Snacks & Breakfast')).toBe('Snacks & Breakfast');
    expect(inferGroceryCategory('iced tea', 'Pantry & Other')).toBe('Beverages');
  });
});
