import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const publicDir = resolve(__dirname, '../public');
const envPath = resolve(publicDir, 'env.js');
const envExamplePath = resolve(publicDir, 'env.example.js');

for (const localEnvironmentFile of ['.env.local', '.env']) {
  const localEnvironmentPath = resolve(projectRoot, localEnvironmentFile);
  if (existsSync(localEnvironmentPath)) process.loadEnvFile(localEnvironmentPath);
}

const supabaseUrl = process.env['MEAL_PLANNER_SUPABASE_URL']?.trim() ?? '';
const supabasePublishableKey =
  process.env['MEAL_PLANNER_SUPABASE_PUBLISHABLE_KEY']?.trim() ??
  process.env['MEAL_PLANNER_SUPABASE_ANON_KEY']?.trim() ??
  '';
const isProductionDeployment =
  process.env['VERCEL_ENV'] === 'production' ||
  process.env['WORKERS_CI'] === '1';

mkdirSync(publicDir, { recursive: true });

if (
  supabaseUrl &&
  supabasePublishableKey
) {
  writeFileSync(
    envPath,
    `window.mealPlannerEnv = {\n  supabaseUrl: ${JSON.stringify(supabaseUrl)},\n  supabaseAnonKey: ${JSON.stringify(
      supabasePublishableKey
    )}\n};\n`,
    'utf8'
  );

  process.stdout.write('Generated apps/web/public/env.js from runtime environment variables.\n');
  process.exit(0);
}

if (isProductionDeployment) {
  const missingVariables = [
    !supabaseUrl ? 'MEAL_PLANNER_SUPABASE_URL' : null,
    !supabasePublishableKey ? 'MEAL_PLANNER_SUPABASE_PUBLISHABLE_KEY' : null,
  ].filter(Boolean);

  throw new Error(
    `Production deployment is missing required environment variables: ${missingVariables.join(', ')}.`
  );
}

if (existsSync(envPath)) {
  process.stdout.write('Keeping existing apps/web/public/env.js.\n');
  process.exit(0);
}

copyFileSync(envExamplePath, envPath);
process.stdout.write('Created apps/web/public/env.js from env.example.js fallback.\n');
