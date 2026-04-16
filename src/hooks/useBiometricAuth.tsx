import { useCallback, useEffect, useState } from 'react';

/**
 * Biometric quick-unlock using WebAuthn (Face ID / Touch ID / Windows Hello / Android Biometric).
 *
 * Flow:
 *  1. User logs in with email+password normally.
 *  2. In Profile, toggles "Biometric unlock" → we register a platform authenticator
 *     credential and AES-GCM-encrypt their session refresh token with a key
 *     stored in localStorage (the biometry just gates access to the page, not
 *     to the encryption key directly — this is "convenience" not "secure enclave").
 *  3. On reopen / inactivity, AppLock asks for biometric → on success we restore
 *     the supabase session silently.
 *
 * Note: True end-to-end secure enclave binding requires PRF extension (Chrome only)
 * or native Capacitor. This is the best portable web compromise for "quick unlock".
 */

const STORAGE = {
  enabled: 'decode_bio_enabled',
  credId: 'decode_bio_cred_id',
  userHandle: 'decode_bio_user_handle',
  cipher: 'decode_bio_session_cipher',
  iv: 'decode_bio_session_iv',
  key: 'decode_bio_aes_key',
  userEmail: 'decode_bio_email',
};

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
function b64decode(s: string): Uint8Array {
  const raw = atob(s);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function toBuf(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

/** True when running inside a cross-origin iframe (e.g., Lovable preview).
 *  WebAuthn is blocked there and any biometric prompt would fail with
 *  "The origin of the document is not the same as its ancestors". */
export function isInCrossOriginFrame(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.self === window.top) return false;
    void window.top!.location.href;
    return false;
  } catch {
    return true;
  }
}

export function isBiometricSupported(): boolean {
  return typeof window !== 'undefined'
    && !!window.PublicKeyCredential
    && !!window.crypto?.subtle
    && !isInCrossOriginFrame();
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isBiometricEnabled(): boolean {
  return localStorage.getItem(STORAGE.enabled) === '1'
    && !!localStorage.getItem(STORAGE.credId)
    && !!localStorage.getItem(STORAGE.cipher);
}

async function getOrCreateAesKey(): Promise<CryptoKey> {
  let raw = localStorage.getItem(STORAGE.key);
  if (!raw) {
    const k = crypto.getRandomValues(new Uint8Array(32));
    raw = b64encode(k);
    localStorage.setItem(STORAGE.key, raw);
  }
  const keyBytes = b64decode(raw);
  return crypto.subtle.importKey('raw', toBuf(keyBytes), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptString(plain: string): Promise<{ cipher: string; iv: string }> {
  const key = await getOrCreateAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plain);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toBuf(iv) }, key, data);
  return { cipher: b64encode(ct), iv: b64encode(iv) };
}

async function decryptString(cipherB64: string, ivB64: string): Promise<string> {
  const key = await getOrCreateAesKey();
  const iv = b64decode(ivB64);
  const ct = b64decode(cipherB64);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBuf(iv) }, key, toBuf(ct));
  return new TextDecoder().decode(pt);
}

/** Register a platform authenticator. User must already be logged in. */
export async function enableBiometric(opts: {
  userId: string;
  email: string;
  refreshToken: string;
}): Promise<void> {
  if (!isBiometricSupported()) throw new Error('Biometria não suportada neste navegador.');
  const available = await isBiometricAvailable();
  if (!available) throw new Error('Nenhum sensor biométrico disponível neste dispositivo.');

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userHandle = crypto.getRandomValues(new Uint8Array(16));

  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Decode Analytics Academy', id: window.location.hostname },
      user: {
        id: userHandle,
        name: opts.email,
        displayName: opts.email,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  }) as PublicKeyCredential | null;

  if (!cred) throw new Error('Falha ao registrar biometria.');

  const { cipher, iv } = await encryptString(opts.refreshToken);

  localStorage.setItem(STORAGE.credId, b64encode(cred.rawId));
  localStorage.setItem(STORAGE.userHandle, b64encode(userHandle));
  localStorage.setItem(STORAGE.cipher, cipher);
  localStorage.setItem(STORAGE.iv, iv);
  localStorage.setItem(STORAGE.userEmail, opts.email);
  localStorage.setItem(STORAGE.enabled, '1');
}

export function disableBiometric(): void {
  localStorage.removeItem(STORAGE.enabled);
  localStorage.removeItem(STORAGE.credId);
  localStorage.removeItem(STORAGE.userHandle);
  localStorage.removeItem(STORAGE.cipher);
  localStorage.removeItem(STORAGE.iv);
  localStorage.removeItem(STORAGE.key);
  localStorage.removeItem(STORAGE.userEmail);
}

/** Refresh the encrypted token (call after a fresh sign-in if biometric is already enabled) */
export async function refreshBiometricToken(refreshToken: string): Promise<void> {
  if (!isBiometricEnabled()) return;
  const { cipher, iv } = await encryptString(refreshToken);
  localStorage.setItem(STORAGE.cipher, cipher);
  localStorage.setItem(STORAGE.iv, iv);
}

/** Prompt biometry and return the decrypted refresh token */
export async function verifyBiometric(): Promise<string> {
  if (!isBiometricEnabled()) throw new Error('Biometria não está habilitada.');
  const credIdB64 = localStorage.getItem(STORAGE.credId)!;
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname,
      userVerification: 'required',
      allowCredentials: [{
        id: toBuf(b64decode(credIdB64)),
        type: 'public-key',
        transports: ['internal'],
      }],
    },
  }) as PublicKeyCredential | null;

  if (!assertion) throw new Error('Verificação biométrica cancelada.');

  const cipher = localStorage.getItem(STORAGE.cipher)!;
  const iv = localStorage.getItem(STORAGE.iv)!;
  return decryptString(cipher, iv);
}

export function getBiometricEmail(): string | null {
  return localStorage.getItem(STORAGE.userEmail);
}

/** React hook returning availability status */
export function useBiometricStatus() {
  const [supported, setSupported] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(isBiometricEnabled());

  useEffect(() => {
    setSupported(isBiometricSupported());
    isBiometricAvailable().then(setAvailable);
  }, []);

  const refresh = useCallback(() => setEnabled(isBiometricEnabled()), []);

  return { supported, available, enabled, refresh };
}
