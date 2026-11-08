import {
  formatRecipeQuantity,
  recipeScaleFactor,
  scaleRecipeIngredientLine,
  scaleRecipeQuantity
} from './recipe-scaling';

describe('recipe serving scaling', () => {
  it('derives scale factors from the recipe base instead of storing serving variants', () => {
    expect(recipeScaleFactor(4, 2)).toBe(0.5);
    expect(recipeScaleFactor(4, 4)).toBe(1);
    expect(recipeScaleFactor(4, 6)).toBe(1.5);
    expect(recipeScaleFactor(2, 6)).toBe(3);
  });

  it('scales numeric quantities and preserves qualitative ingredients', () => {
    expect(scaleRecipeQuantity(1.5, 4, 2)).toBe(0.75);
    expect(scaleRecipeQuantity(1.5, 4, 6)).toBe(2.25);
    expect(scaleRecipeQuantity(null, 4, 6)).toBeNull();
  });

  it('formats common scaled fractions for cooking', () => {
    expect(formatRecipeQuantity(0.375)).toBe('⅜');
    expect(formatRecipeQuantity(0.5)).toBe('½');
    expect(formatRecipeQuantity(1.5)).toBe('1 ½');
    expect(formatRecipeQuantity(2.25)).toBe('2 ¼');
    expect(formatRecipeQuantity(2.666666)).toBe('2 ⅔');
  });

  it('scales quantities shown below instruction steps', () => {
    expect(scaleRecipeIngredientLine('2 cups water', 4, 2)).toBe('1 cup water');
    expect(scaleRecipeIngredientLine('½ tsp salt', 4, 6)).toBe('¾ tsp salt');
    expect(scaleRecipeIngredientLine('40 fl oz (5 cups) broth', 4, 2)).toBe(
      '20 fl oz (2 ½ cups) broth'
    );
    expect(scaleRecipeIngredientLine('2 (1 inch) pieces ginger root', 4, 2)).toBe(
      '1 (1 inch) piece ginger root'
    );
    expect(scaleRecipeIngredientLine('about 6 cups water', 4, 2)).toBe('about 6 cups water');
  });

  it('rejects invalid serving bases and quantities', () => {
    expect(() => recipeScaleFactor(0, 4)).toThrowError();
    expect(() => formatRecipeQuantity(-1)).toThrowError();
  });
});
