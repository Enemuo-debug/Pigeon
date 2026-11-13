export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    const port = 5000;
    return `http://${hostname}:${port}`;
  }
  return 'http://localhost:5000';
};

export const API_BASE = getApiBaseUrl();
