import apiClient from '../api';

import type {
  BalanceResponse,
  GenerateVoucherPayload,
  GenerateVoucherResponse,
  GetPointsToEarnPayload,
  PointsRateResponse,
  PointsToEarnResponse,
  ProgramDetailsResponse,
  RedeemPointsPayload,
} from './types';

const withFreshToken = (freshToken: string, body: unknown) => ({
  ...(body as Record<string, unknown>),
  token: freshToken,
});

const generateVoucher = (
  payload: GenerateVoucherPayload,
): Promise<GenerateVoucherResponse> =>
  apiClient.post('/checkout/voucher/generate', payload, {
    onTokenRefresh: withFreshToken,
  });

const redeemPoints = (
  payload: RedeemPointsPayload,
): Promise<GenerateVoucherResponse> =>
  apiClient.post('/checkout/redeem', payload, {
    onTokenRefresh: withFreshToken,
  });

const getPointsToEarn = (
  payload: GetPointsToEarnPayload,
): Promise<PointsToEarnResponse> =>
  apiClient.post('/checkout/initiate/points/to-earn', payload, {
    onTokenRefresh: withFreshToken,
  });

const getPointsRate = (): Promise<PointsRateResponse> =>
  apiClient.get('/checkout/points/rate');

const getBalance = (sessionId: string): Promise<BalanceResponse> =>
  apiClient.get('/checkout/balance', { sessionId });

const getProgramDetails = (
  sessionId: string,
): Promise<ProgramDetailsResponse> =>
  apiClient.get('/checkout/program/details', { sessionId });

export default {
  getBalance,
  getProgramDetails,
  getPointsRate,
  generateVoucher,
  redeemPoints,
  getPointsToEarn,
};
