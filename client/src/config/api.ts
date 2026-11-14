export const getApiBaseUrl = (): string => {
  // 1. If explicit backend API URL is provided via env var (e.g. on Vercel)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // 2. Browser dynamic resolution
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    // If deployed on Vercel and no external backend is specified, use same-origin relative path
    if (hostname.includes('vercel.app')) {
      return '';
    }
    const port = 5000;
    return `http://${hostname}:${port}`;
  }

  return 'http://localhost:5000';
};

export const API_BASE = getApiBaseUrl();
