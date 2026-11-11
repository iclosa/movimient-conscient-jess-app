/** URL del backend. Se cambia con EXPO_PUBLIC_API_BASE_URL (ver .env.example). */
export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://moviment-conscient-backend-y2g5.onrender.com/api/v1'
).replace(/\/+$/, '');
