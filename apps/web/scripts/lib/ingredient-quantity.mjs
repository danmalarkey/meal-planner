const FRACTIONS = new Map([
  ['⅛', 1 / 8],
  ['⅙', 1 / 6],
  ['¼', 1 / 4],
  ['⅓', 1 / 3],
  ['⅜', 3 / 8],
  ['½', 1 / 2],
  ['⅝', 5 / 8],
  ['⅔', 2 / 3],
  ['¾', 3 / 4],
  ['⅚', 5 / 6],
  ['⅞', 7 / 8]
]);

const AMOUNT_PATTERN = /^(?:(\d+(?:\.\d+)?)\s*)?([⅛⅙¼⅓⅜½⅝⅔¾⅚⅞])?(?:\s+|$)(.*)$/u;

export function parseIngredientAmount(amountText) {
  if (amountText === null || amountText === undefined || amountText.trim() === '') {
    return { quantity: null, unit: null };
  }

  const match = amountText.trim().match(AMOUNT_PATTERN);
  if (!match || (!match[1] && !match[2])) {
    throw new Error(`Unsupported ingredient amount: ${amountText}`);
  }

  const whole = match[1] ? Number(match[1]) : 0;
  const fraction = match[2] ? FRACTIONS.get(match[2]) : 0;

  return {
    quantity: whole + fraction,
    unit: match[3]?.trim() || null
  };
}
