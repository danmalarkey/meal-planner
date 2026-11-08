import assert from 'node:assert/strict';
import test from 'node:test';
import { parseIngredientAmount } from './ingredient-quantity.mjs';

test('parses whole, fractional, and mixed ingredient amounts', () => {
  assert.deepEqual(parseIngredientAmount('6'), { quantity: 6, unit: null });
  assert.deepEqual(parseIngredientAmount('½ cup'), { quantity: 0.5, unit: 'cup' });
  assert.deepEqual(parseIngredientAmount('1 ½ lb'), { quantity: 1.5, unit: 'lb' });
  assert.deepEqual(parseIngredientAmount('⅔ (8 oz) block'), {
    quantity: 2 / 3,
    unit: '(8 oz) block'
  });
});

test('preserves qualitative ingredients as unscaled', () => {
  assert.deepEqual(parseIngredientAmount(null), { quantity: null, unit: null });
  assert.deepEqual(parseIngredientAmount(''), { quantity: null, unit: null });
});

test('rejects unsupported amount formats instead of guessing', () => {
  assert.throws(() => parseIngredientAmount('to taste'));
});
