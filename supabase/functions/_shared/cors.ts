const DEFAULT_ALLOWED_ORIGINS = new Set(['http://localhost:4300']);

function allowedOrigins(): Set<string> {
  const configuredOrigins = Deno.env
    .get('MEAL_PLANNER_ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configuredOrigins?.length ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS);
}

export function allowedRequestOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')?.trim() ?? '';
  return allowedOrigins().has(origin) ? origin : null;
}

export function corsHeaders(request: Request): HeadersInit {
  const allowedOrigin = allowedRequestOrigin(request) ?? 'http://localhost:4300';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

export function handleCors(request: Request): Response | null {
  return request.method === 'OPTIONS'
    ? new Response('ok', { headers: corsHeaders(request) })
    : null;
}
