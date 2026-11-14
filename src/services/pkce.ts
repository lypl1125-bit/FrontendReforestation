export const GOOGLE_PKCE_VERIFIER_STORAGE_KEY = 'reforesta-google-code-verifier';

export type PkcePair = {
  verifier: string;
  challenge: string;
};

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createPkcePair(): Promise<PkcePair> {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error('Este navegador no permite iniciar una autenticación segura con Google.');
  }

  const verifier = base64Url(globalThis.crypto.getRandomValues(new Uint8Array(32)));
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  return {
    verifier,
    challenge: base64Url(new Uint8Array(digest)),
  };
}
