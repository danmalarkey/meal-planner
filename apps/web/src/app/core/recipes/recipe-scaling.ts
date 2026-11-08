export const SUPPORTED_RECIPE_SERVINGS = [2, 4, 6] as const;

export type SupportedRecipeServings = (typeof SUPPORTED_RECIPE_SERVINGS)[number];

const DISPLAY_FRACTIONS = [
  { value: 1 / 8, glyph: '⅛' },
  { value: 1 / 6, glyph: '⅙' },
  { value: 1 / 4, glyph: '¼' },
  { value: 1 / 3, glyph: '⅓' },
  { value: 3 / 8, glyph: '⅜' },
  { value: 1 / 2, glyph: '½' },
  { value: 5 / 8, glyph: '⅝' },
  { value: 2 / 3, glyph: '⅔' },
  { value: 3 / 4, glyph: '¾' },
  { value: 5 / 6, glyph: '⅚' },
  { value: 7 / 8, glyph: '⅞' }
] as const;

const INPUT_FRACTIONS = new Map<string, number>(
  DISPLAY_FRACTIONS.map((fraction) => [fraction.glyph, fraction.value])
);
const QUANTITY_PATTERN = '(?:\\d+(?:\\.\\d+)?(?:\\s+[⅛⅙¼⅓⅜½⅝⅔¾⅚⅞])?|[⅛⅙¼⅓⅜½⅝⅔¾⅚⅞])';
const LEADING_QUANTITY_PATTERN = new RegExp(`^(${QUANTITY_PATTERN})(?=\\s|$)`, 'u');
const CONVERSION_QUANTITY_PATTERN = new RegExp(
  `^(\\s+[^()]*(?:[A-Za-z])[^()]*)\\(((${QUANTITY_PATTERN})(?=\\s)[^)]*)\\)`,
  'u'
);

export function recipeScaleFactor(
  baseServings: number,
  targetServings: SupportedRecipeServings
): number {
  if (!Number.isFinite(baseServings) || baseServings <= 0) {
    throw new Error('Recipe base servings must be greater than zero.');
  }

  return targetServings / baseServings;
}

export function scaleRecipeQuantity(
  baseQuantity: number | null,
  baseServings: number,
  targetServings: SupportedRecipeServings
): number | null {
  if (baseQuantity === null) return null;
  return baseQuantity * recipeScaleFactor(baseServings, targetServings);
}

export function formatRecipeQuantity(quantity: number | null): string | null {
  if (quantity === null) return null;
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('Recipe quantity must be a non-negative number.');
  }

  const roundedInteger = Math.round(quantity);
  if (Math.abs(quantity - roundedInteger) < 0.001) return String(roundedInteger);

  const whole = Math.floor(quantity);
  const remainder = quantity - whole;
  const fraction = DISPLAY_FRACTIONS.reduce((closest, candidate) =>
    Math.abs(candidate.value - remainder) < Math.abs(closest.value - remainder)
      ? candidate
      : closest
  );

  if (Math.abs(fraction.value - remainder) <= 0.015) {
    return whole > 0 ? `${whole} ${fraction.glyph}` : fraction.glyph;
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    useGrouping: false
  }).format(quantity);
}

export function scaleRecipeIngredientLine(
  line: string,
  baseServings: number,
  targetServings: SupportedRecipeServings
): string {
  if (baseServings === targetServings) return line;

  const leadingMatch = line.match(LEADING_QUANTITY_PATTERN);
  if (!leadingMatch) return line;

  const factor = recipeScaleFactor(baseServings, targetServings);
  const scaledLeading = formatRecipeQuantity(parseDisplayQuantity(leadingMatch[1]) * factor);
  let remainder = line.slice(leadingMatch[1].length);

  remainder = remainder.replace(
    CONVERSION_QUANTITY_PATTERN,
    (match, prefix: string, conversion: string, conversionQuantity: string) => {
      const scaledConversion = formatRecipeQuantity(
        parseDisplayQuantity(conversionQuantity) * factor
      );
      return scaledConversion
        ? `${prefix}(${conversion.replace(conversionQuantity, scaledConversion)})`
        : match;
    }
  );

  if (!scaledLeading) return line;

  const scaledLine = `${scaledLeading}${remainder}`;
  if (Math.abs(parseDisplayQuantity(scaledLeading) - 1) >= 0.001) return scaledLine;

  const singularUnits: Record<string, string> = {
    cups: 'cup',
    tablespoons: 'tablespoon',
    teaspoons: 'teaspoon',
    ounces: 'ounce',
    pounds: 'pound',
    cloves: 'clove',
    cans: 'can',
    sticks: 'stick',
    pieces: 'piece'
  };
  return scaledLine.replace(
    /^(1(?:\s+\([^)]*\))?\s+)(cups|tablespoons|teaspoons|ounces|pounds|cloves|cans|sticks|pieces)\b/,
    (_, prefix: string, unit: string) => `${prefix}${singularUnits[unit]}`
  );
}

function parseDisplayQuantity(value: string): number {
  const fractionGlyph = [...value].find((character) => INPUT_FRACTIONS.has(character));
  const wholeMatch = value.match(/\d+(?:\.\d+)?/);
  return (
    (wholeMatch ? Number(wholeMatch[0]) : 0) +
    (fractionGlyph ? INPUT_FRACTIONS.get(fractionGlyph)! : 0)
  );
}
