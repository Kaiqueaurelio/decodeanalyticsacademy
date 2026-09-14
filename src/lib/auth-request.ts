export class AuthRequestTimeout extends Error {
  constructor() {
    super('O serviço de autenticação demorou para responder. Aguarde um instante e tente novamente.');
    this.name = 'AuthRequestTimeout';
  }
}

/** Bound both the connection and response body; never retry a credential POST. */
export async function fetchAuthResponse(url: string, init: RequestInit, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const body = await response.json().catch((error: unknown) => {
      if (controller.signal.aborted) throw error;
      return {};
    });
    return { response, body };
  } catch (error) {
    if (controller.signal.aborted) throw new AuthRequestTimeout();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
