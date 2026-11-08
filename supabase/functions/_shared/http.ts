import { corsHeaders } from './cors.ts';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json'
    }
  });
}

export function errorResponse(
  request: Request,
  error: unknown,
  fallback = 'The image request could not be completed.'
): Response {
  if (error instanceof HttpError) {
    return jsonResponse(request, { error: error.message }, error.status);
  }

  console.error(error);
  return jsonResponse(request, { error: fallback }, 500);
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return await request.json() as T;
  } catch {
    throw new HttpError(400, 'A valid JSON request body is required.');
  }
}
