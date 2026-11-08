import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parseIngredientAmount } from './lib/ingredient-quantity.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDirectory, '..');
const repositoryRoot = resolve(scriptDirectory, '../../..');
const defaultSourceDirectory = resolve(
  repositoryRoot,
  'local-data/mealime/raw/Mealime%20Family%20Archive'
);
const localEnvironmentFile = resolve(webRoot, '.env.import.local');

if (existsSync(localEnvironmentFile)) process.loadEnvFile(localEnvironmentFile);

const options = commandLineOptions(process.argv.slice(2));

if (options.help) {
  console.log(`Usage:
  npm run import:mealime -- [--limit 5] [--source PATH]
  npm run import:mealime -- --apply --household-id UUID [--limit 5] [--source PATH]

The importer is dry-run only unless --apply is present.`);
  process.exit(0);
}

const archivePath = options.sourceDirectory ?? defaultSourceDirectory;
const recipesPath = resolve(archivePath, 'mealime-recipes.json');
const imagesPath = resolve(archivePath, 'Mealime Images');
const archive = JSON.parse(readFileSync(recipesPath, 'utf8'));
const recipeEntries = Object.entries(archive.recipes_by_id)
  .sort(([left], [right]) => Number(left) - Number(right))
  .slice(0, options.limit ?? undefined);
const validation = validateArchive(recipeEntries, imagesPath);

console.log(JSON.stringify({
  mode: options.apply ? 'apply' : 'dry-run',
  sourceRecipes: archive.recipe_count,
  selectedRecipes: recipeEntries.length,
  ingredients: validation.ingredientCount,
  scalableIngredients: validation.scalableIngredientCount,
  qualitativeIngredients: validation.qualitativeIngredientCount,
  instructionSteps: validation.stepCount,
  cookwareEntries: validation.cookwareCount,
  matchedImages: validation.imageCount
}, null, 2));

if (!options.apply) {
  console.log('Dry run complete. No database or Storage changes were made.');
  process.exit(0);
}

if (!options.householdId || !isUuid(options.householdId)) {
  throw new Error('--household-id must be a valid UUID when --apply is used.');
}

const supabaseUrl = requiredEnvironmentValue('MEAL_PLANNER_SUPABASE_URL');
const secretKey = requiredEnvironmentValue('MEAL_PLANNER_SUPABASE_SECRET_KEY');
const projectRef = requiredEnvironmentValue('MEAL_PLANNER_SUPABASE_PROJECT_REF');
const expectedHost = `${projectRef}.supabase.co`;

if (new URL(supabaseUrl).hostname !== expectedHost) {
  throw new Error('The Supabase URL does not match MEAL_PLANNER_SUPABASE_PROJECT_REF.');
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

await assertMealPlannerProject(supabase, options.householdId);
await importRecipes(supabase, options.householdId, recipeEntries, imagesPath);
await verifyImport(supabase, options.householdId, recipeEntries);

console.log(`Imported ${recipeEntries.length} recipes into household ${options.householdId}.`);

function commandLineOptions(argumentsList) {
  const parsed = {
    apply: false,
    help: false,
    householdId: null,
    limit: null,
    sourceDirectory: null
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    if (argument === '--apply') parsed.apply = true;
    else if (argument === '--help' || argument === '-h') parsed.help = true;
    else if (argument === '--household-id') parsed.householdId = argumentsList[++index];
    else if (argument.startsWith('--household-id=')) parsed.householdId = argument.split('=', 2)[1];
    else if (argument === '--source') parsed.sourceDirectory = resolve(argumentsList[++index]);
    else if (argument.startsWith('--source=')) parsed.sourceDirectory = resolve(argument.split('=', 2)[1]);
    else if (argument === '--limit') parsed.limit = positiveInteger(argumentsList[++index], '--limit');
    else if (argument.startsWith('--limit=')) parsed.limit = positiveInteger(argument.split('=', 2)[1], '--limit');
    else throw new Error(`Unknown argument: ${argument}`);
  }

  return parsed;
}

function positiveInteger(value, optionName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }
  return parsed;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function requiredEnvironmentValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function validateArchive(entries, imageDirectory) {
  let ingredientCount = 0;
  let scalableIngredientCount = 0;
  let qualitativeIngredientCount = 0;
  let stepCount = 0;
  let cookwareCount = 0;

  for (const [sourceId, recipe] of entries) {
    if (String(recipe.id) !== sourceId) throw new Error(`Recipe ID mismatch: ${sourceId}`);
    if (!recipe.title?.trim()) throw new Error(`Recipe ${sourceId} has no title.`);
    if (!Number.isInteger(recipe.servings) || recipe.servings <= 0) {
      throw new Error(`Recipe ${sourceId} has invalid base servings.`);
    }
    if (!existsSync(resolve(imageDirectory, recipe.image.filename))) {
      throw new Error(`Recipe ${sourceId} image is missing: ${recipe.image.filename}`);
    }
    if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
      throw new Error(`Recipe ${sourceId} has no instructions.`);
    }
    if (!Array.isArray(recipe.cookware) || recipe.cookware.length === 0) {
      throw new Error(`Recipe ${sourceId} has no cookware entries.`);
    }

    for (const ingredient of recipe.ingredients) {
      const parsed = parseIngredientAmount(ingredient.amount);
      ingredientCount += 1;
      if (parsed.quantity === null) qualitativeIngredientCount += 1;
      else scalableIngredientCount += 1;
    }

    stepCount += recipe.instructions.length;
    cookwareCount += recipe.cookware.length;
  }

  return {
    ingredientCount,
    scalableIngredientCount,
    qualitativeIngredientCount,
    stepCount,
    cookwareCount,
    imageCount: entries.length
  };
}

async function assertMealPlannerProject(supabase, householdId) {
  const { data: identity, error: identityError } = await supabase
    .from('application_identity')
    .select('application_key')
    .eq('application_key', 'meal-planner')
    .maybeSingle();

  if (identityError || identity?.application_key !== 'meal-planner') {
    throw new Error('The target Supabase project is not initialized as Meal Planner.');
  }

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('id')
    .eq('id', householdId)
    .maybeSingle();

  if (householdError || !household) {
    throw new Error('The target household does not exist in Meal Planner.');
  }
}

async function importRecipes(supabase, householdId, entries, imageDirectory) {
  const ingredientSources = new Map();

  for (const [, recipe] of entries) {
    for (const ingredient of recipe.ingredients) {
      ingredientSources.set(ingredient.canonical_id, ingredient);
    }
  }

  const ingredientRows = [...ingredientSources.values()].map((ingredient) => ({
    household_id: householdId,
    source_provider: 'mealime',
    source_id: ingredient.canonical_id,
    name: ingredient.canonical_name,
    category: ingredient.category,
    gluten_status: ingredient.gluten_status,
    source_data: ingredient
  }));
  const ingredientIds = new Map();

  for (const rows of chunks(ingredientRows, 250)) {
    const { data, error } = await supabase
      .from('ingredients')
      .upsert(rows, { onConflict: 'household_id,source_provider,source_id' })
      .select('id,source_id');
    if (error) throw error;
    for (const row of data) ingredientIds.set(row.source_id, row.id);
  }

  const recipeRows = entries.map(([sourceId, recipe]) => ({
    household_id: householdId,
    source_provider: 'mealime',
    source_id: sourceId,
    title: recipe.title,
    minutes: recipe.minutes,
    base_servings: recipe.servings,
    image_filename: recipe.image.filename,
    image_original_url: recipe.image.url,
    source_metadata: recipe.source,
    dietary_metadata: recipe.gf
  }));
  const recipeIds = new Map();

  for (const rows of chunks(recipeRows, 100)) {
    const { data, error } = await supabase
      .from('recipes')
      .upsert(rows, { onConflict: 'household_id,source_provider,source_id' })
      .select('id,source_id');
    if (error) throw error;
    for (const row of data) recipeIds.set(row.source_id, row.id);
  }

  let completed = 0;
  for (const [sourceId, recipe] of entries) {
    const recipeId = recipeIds.get(sourceId);
    if (!recipeId) throw new Error(`Recipe row was not returned for ${sourceId}.`);

    const imagePath = `${householdId}/${recipeId}/${sourceId}.jpg`;
    const imageBytes = await readFile(resolve(imageDirectory, recipe.image.filename));
    const { error: imageError } = await supabase.storage
      .from('recipe-images')
      .upload(imagePath, imageBytes, { contentType: 'image/jpeg', upsert: true });
    if (imageError) throw imageError;

    const { error: imagePathError } = await supabase
      .from('recipes')
      .update({ image_storage_path: imagePath })
      .eq('id', recipeId);
    if (imagePathError) throw imagePathError;

    const recipeIngredientRows = recipe.ingredients.map((ingredient, index) => {
      const normalized = parseIngredientAmount(ingredient.amount);
      const ingredientId = ingredientIds.get(ingredient.canonical_id);
      if (!ingredientId) throw new Error(`Ingredient row is missing: ${ingredient.canonical_id}`);

      return {
        household_id: householdId,
        recipe_id: recipeId,
        ingredient_id: ingredientId,
        position: index + 1,
        normalized_quantity: normalized.quantity,
        normalized_unit: normalized.unit,
        quantity_text: ingredient.quantity,
        unit_text: ingredient.unit,
        amount_text: ingredient.amount,
        display_text: ingredient.display_text,
        shopping_text: ingredient.shopping_text,
        source_text: ingredient.source_text,
        pantry_staple: ingredient.pantry_staple,
        shopping_notes: ingredient.shopping_notes,
        source_data: ingredient
      };
    });
    const stepRows = recipe.instructions.map((step, index) => ({
      household_id: householdId,
      recipe_id: recipeId,
      position: index + 1,
      instruction: step.text
    }));
    const cookwareRows = recipe.cookware.map((name, index) => ({
      household_id: householdId,
      recipe_id: recipeId,
      position: index + 1,
      name
    }));

    await upsertOrderedRows(supabase, 'recipe_ingredients', recipeId, recipeIngredientRows);
    await upsertOrderedRows(supabase, 'recipe_steps', recipeId, stepRows);
    await upsertOrderedRows(supabase, 'recipe_cookware', recipeId, cookwareRows);

    completed += 1;
    if (completed % 10 === 0 || completed === entries.length) {
      console.log(`Imported ${completed}/${entries.length} recipes.`);
    }
  }
}

async function upsertOrderedRows(supabase, table, recipeId, rows) {
  const { error: upsertError } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'recipe_id,position' });
  if (upsertError) throw upsertError;

  const { error: cleanupError } = await supabase
    .from(table)
    .delete()
    .eq('recipe_id', recipeId)
    .gt('position', rows.length);
  if (cleanupError) throw cleanupError;
}

async function verifyImport(supabase, householdId, entries) {
  const sourceIds = entries.map(([sourceId]) => sourceId);
  const { data: recipes, error: recipeError } = await supabase
    .from('recipes')
    .select('id,source_id,image_storage_path')
    .eq('household_id', householdId)
    .eq('source_provider', 'mealime')
    .in('source_id', sourceIds);
  if (recipeError) throw recipeError;

  if (recipes.length !== entries.length || recipes.some((recipe) => !recipe.image_storage_path)) {
    throw new Error('Post-import recipe or image-path verification failed.');
  }

  const recipeIds = recipes.map((recipe) => recipe.id);
  const expectedCounts = {
    recipe_ingredients: entries.reduce((total, [, recipe]) => total + recipe.ingredients.length, 0),
    recipe_steps: entries.reduce((total, [, recipe]) => total + recipe.instructions.length, 0),
    recipe_cookware: entries.reduce((total, [, recipe]) => total + recipe.cookware.length, 0)
  };

  for (const [table, expectedCount] of Object.entries(expectedCounts)) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .in('recipe_id', recipeIds);
    if (error) throw error;
    if (count !== expectedCount) {
      throw new Error(`${table} verification failed: expected ${expectedCount}, received ${count}.`);
    }
  }

  console.log('Post-import recipe, image-path, ingredient, step, and cookware counts verified.');
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}
