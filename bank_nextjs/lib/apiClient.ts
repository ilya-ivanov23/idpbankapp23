import { cookies } from 'next/headers';
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.idpbank.app',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = cookies().get('accessToken')?.value;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

