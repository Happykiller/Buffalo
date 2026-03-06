const rawAppName = import.meta.env.VITE_APP_NAME as string | undefined;

export const APP_NAME = rawAppName?.trim() || 'Buffalo';

const storageSlug = APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const USER_STORAGE_KEY = `${storageSlug || 'buffalo'}_user`;
