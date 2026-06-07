export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url';

export const DEFAULT_ELLA_AVATAR =
  'https://gynguskgysompgcajunc.supabase.co/storage/v1/object/public/ads/ads/ella-ribeiro-avatar.jpg';

export const getEllaAvatarUrl = () => {
  try {
    return localStorage.getItem(ELLA_AVATAR_STORAGE_KEY) || DEFAULT_ELLA_AVATAR;
  } catch {
    return DEFAULT_ELLA_AVATAR;
  }
};
