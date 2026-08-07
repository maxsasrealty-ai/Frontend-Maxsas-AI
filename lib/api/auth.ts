import { ApiEnvelope } from "../../shared/contracts";

import { setCurrentAuthUser } from "../auth/session";
import { setTokens } from "../auth/tokens";
import { resolveApiBaseUrl } from "./base-url";
import { ApiClient } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName?: string;
  createdAt: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface SignupSendOtpRequest {
  email: string;
}

export interface SignupVerifyRequest {
  email: string;
  otp: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResetRequest {
  email: string;
  otp: string;
  newPassword: string;
}

interface AuthResponseData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string | null;
  user?: AuthUser;
  maskedEmail?: string;
  otpExpiresAt?: string;
  magicLinkExpiresAt?: string;
  cooldownSeconds?: number;
  otpExpiresInSeconds?: number;
  expiresInSeconds?: number;
  [key: string]: unknown;
}

const publicApiClient = new ApiClient({
  baseUrl: resolveApiBaseUrl(),
  timeoutMs: 45000,
});

async function persistAuthResponse(data: AuthResponseData | undefined): Promise<void> {
  if (!data) {
    return;
  }

  if (data.accessToken && data.refreshToken) {
    await setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt ?? null,
    });
  }

  const nestedUser = data.user;
  const directUser = data as Partial<AuthUser>;

  if (nestedUser) {
    await setCurrentAuthUser(nestedUser);
    return;
  }

  if (directUser.id && directUser.email && directUser.fullName && directUser.tenantId) {
    await setCurrentAuthUser({
      id: directUser.id,
      email: directUser.email,
      fullName: directUser.fullName,
      tenantId: directUser.tenantId,
      tenantName: directUser.tenantName,
      createdAt: directUser.createdAt || new Date().toISOString(),
    });
  }
}

export async function signupWithEmailPassword(
  payload: SignupRequest
): Promise<ApiEnvelope<AuthResponseData>> {
  const response = await publicApiClient.post<SignupRequest, AuthResponseData>("/auth/signup", payload);
  if (response.success) {
    await persistAuthResponse(response.data);
  }

  return response;
}

export async function loginWithEmailPassword(
  payload: LoginRequest
): Promise<ApiEnvelope<AuthResponseData>> {
  const response = await publicApiClient.post<LoginRequest, AuthResponseData>("/auth/login", payload);
  if (response.success) {
    await persistAuthResponse(response.data);
  }

  return response;
}

export async function loginWithGoogle(
  payload: GoogleLoginRequest
): Promise<ApiEnvelope<AuthResponseData>> {
  const response = await publicApiClient.post<GoogleLoginRequest, AuthResponseData>("/auth/google", payload);
  if (response.success) {
    await persistAuthResponse(response.data);
  }

  return response;
}

export async function sendSignupOtp(
  payload: SignupSendOtpRequest
): Promise<ApiEnvelope<AuthResponseData>> {
  // OTP send can take longer due to SMTP delivery; allow extended timeout.
  return publicApiClient.post<SignupSendOtpRequest, AuthResponseData>("/auth/signup/send-otp", payload, undefined, { timeoutMs: 120000 });
}

export async function verifySignupOtp(
  payload: SignupVerifyRequest
): Promise<ApiEnvelope<AuthResponseData>> {
  const response = await publicApiClient.post<SignupVerifyRequest, AuthResponseData>("/auth/signup/verify", payload);
  if (response.success) {
    await persistAuthResponse(response.data);
  }

  return response;
}

export async function requestPasswordResetOtp(
  payload: ForgotPasswordRequest
): Promise<ApiEnvelope<AuthResponseData>> {
  // Password reset OTP send may take longer; allow extended timeout.
  return publicApiClient.post<ForgotPasswordRequest, AuthResponseData>("/auth/password/forgot", payload, undefined, { timeoutMs: 120000 });
}

export async function resetPasswordWithOtp(
  payload: ForgotPasswordResetRequest
): Promise<ApiEnvelope<AuthResponseData>> {
  const response = await publicApiClient.post<ForgotPasswordResetRequest, AuthResponseData>("/auth/password/reset", payload);
  if (response.success) {
    await persistAuthResponse(response.data);
  }

  return response;
}
