export type RuntimeConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

declare global {
  interface Window {
    mealPlannerEnv?: Partial<RuntimeConfig>;
  }
}

const fallbackConfig: RuntimeConfig = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};

export function getRuntimeConfig(): RuntimeConfig {
  const runtimeConfig = window.mealPlannerEnv ?? {};

  return {
    supabaseUrl: runtimeConfig.supabaseUrl ?? fallbackConfig.supabaseUrl,
    supabaseAnonKey: runtimeConfig.supabaseAnonKey ?? fallbackConfig.supabaseAnonKey
  };
}
