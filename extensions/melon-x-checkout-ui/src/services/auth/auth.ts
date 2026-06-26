import apiClient from '../api';

import type {
  RequestOtpPayload,
  RequestOtpResponse,
  CreateCustomerPayload,
  ResendRegistrationOtpPayload,
  VerifyNewCustomerPayload,
} from './types';

const withFreshToken = (freshToken: string, body: unknown) => ({
  ...(body as Record<string, unknown>),
  token: freshToken,
});

const requestOtp = (payload: RequestOtpPayload): Promise<RequestOtpResponse> =>
  apiClient.post('/checkout/customer/create', payload, {
    onTokenRefresh: withFreshToken,
  });

const verifyNewCustomer = (
  payload: VerifyNewCustomerPayload,
): Promise<RequestOtpResponse> =>
  apiClient.post('/checkout/customer/verify', payload, {
    onTokenRefresh: withFreshToken,
  });

const completeProfile = (
  payload: CreateCustomerPayload,
): Promise<RequestOtpResponse> =>
  apiClient.post('/checkout/customer/complete/profile', payload, {
    onTokenRefresh: withFreshToken,
  });

const resendRegistrationOtp = (
  payload: ResendRegistrationOtpPayload,
): Promise<RequestOtpResponse> =>
  apiClient.post('/checkout/customer/resend/registration/otp', payload, {
    onTokenRefresh: withFreshToken,
  });

export default {
  requestOtp,
  verifyNewCustomer,
  completeProfile,
  resendRegistrationOtp,
};
