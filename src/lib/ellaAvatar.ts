import ellaAvatarAsset from "@/assets/ella-ribeiro-avatar.jpg.asset.json";

export const ELLA_AVATAR_STORAGE_KEY = 'decode_ella_avatar_url';

export const DEFAULT_ELLA_AVATAR = ellaAvatarAsset.url;

export const getEllaAvatarUrl = () => {
  try {
    return localStorage.getItem(ELLA_AVATAR_STORAGE_KEY) || DEFAULT_ELLA_AVATAR;
  } catch {
    return DEFAULT_ELLA_AVATAR;
  }
};
