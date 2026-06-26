import apiClient from './api';

import type {
  RequestOtpPayload,
  RequestOtpResponse,
  VerifyOtpPayload,
  CreateCustomerPayload,
  BalanceResponse,
} from './types';

const requestOtp = async (
  payload: RequestOtpPayload,
): Promise<RequestOtpResponse> => {
  return apiClient.post<RequestOtpResponse>(
    '/checkout/otp/request',
    payload,
  );
};

const verifyOtp = async (
  payload: VerifyOtpPayload,
): Promise<unknown> => {
  return apiClient.post(
    '/checkout/otp/verify',
    payload,
  );
};

const getBalance = async (
  sessionId: string,
): Promise<BalanceResponse> => {
  return apiClient.get<BalanceResponse>(
    '/checkout/balance',
    {sessionId},
  );
};

const createCustomer = async (
  payload: CreateCustomerPayload,
): Promise<RequestOtpResponse> => {
  return apiClient.post<RequestOtpResponse>(
    '/checkout/customer/create',
    payload,
  );
};

const authServices = {
  requestOtp,
  verifyOtp,
  getBalance,
  createCustomer,
};

export default authServices;
