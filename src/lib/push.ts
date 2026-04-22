// Helpers para Web Push: registrar subscription do navegador no banco.
import { supabase } from "@/integrations/supabase/client";

// Public key VAPID (segura para expor no client)
export const VAPID_PUBLIC_KEY =
  "BBnXOJdD_WV-0U6esmZNB9ds8fY_GdP2GjapBn4AcxKlTb1MqIPolNDGYNfGHlAAbtyPOAeF9AEQ1rWzGyTJqO0";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufToBase64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function enablePushNotifications(userId: string): Promise<boolean> {
  if (!pushSupported()) return false;

  // Solicita permissão
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;

  // Reaproveita se já existe
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });
  }

  const payload = {
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: bufToBase64Url(sub.getKey("p256dh")),
    auth: bufToBase64Url(sub.getKey("auth")),
    user_agent: navigator.userAgent.slice(0, 200),
  };

  // Upsert via endpoint (UNIQUE)
  await supabase
    .from("push_subscriptions" as any)
    .upsert(payload, { onConflict: "endpoint" } as any);

  return true;
}

export async function disablePushNotifications(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await supabase
    .from("push_subscriptions" as any)
    .delete()
    .eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
