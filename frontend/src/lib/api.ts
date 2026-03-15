export const API_BASE_URL = import.meta.env?.VITE_API_URL ||  'http://smartstock.gamer.gd' || 'http://163.245.221.172';
// export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'https://smartstore.lk';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Add authorization header if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}
