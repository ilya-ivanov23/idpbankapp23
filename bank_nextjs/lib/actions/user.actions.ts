"use server";
import { apiClient } from '../apiClient';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const res = await apiClient.post('/api/auth/login', { username: email, password, deviceId: "web" });
    cookies().set('accessToken', res.data.accessToken, { httpOnly: true, secure: true });
    return res.data;
  } catch (error: any) {
    return { error: error?.response?.data?.message || error.message || "Sign in failed" };
  }
}

export const signUp = async (userData: SignUpParams) => {
  // Step 1 of new auth flow: Register and trigger OTP
  const res = await apiClient.post('/api/auth/register', { 
    email: userData.email, password: userData.password, firstName: userData.firstName, lastName: userData.lastName 
  });
  return res.data;
}

export const verifyOtp = async (email: string, otp: string) => {
  // Step 2 of new auth flow: Verify OTP and get tokens
  const res = await apiClient.post('/api/auth/verify-otp', { email, otp });
  cookies().set('accessToken', res.data.accessToken, { httpOnly: true, secure: true });
  return res.data;
}

export const logoutAccount = async () => {
  cookies().delete('accessToken');
}

export const getLoggedInUser = async () => {
  try {
    const token = cookies().get('accessToken')?.value;
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    const res = await apiClient.get(`/api/internal/users?email=${encodeURIComponent(decoded.sub)}`);
    const data = res.data;
    return { $id: data.id, firstName: data.firstName, lastName: data.lastName, email: data.email };
  } catch (error) {
    return null;
  }
}