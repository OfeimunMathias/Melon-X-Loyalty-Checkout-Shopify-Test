export type Step = 'loyalty' | 'createCustomer' | 'otp' | 'rewards' | 'joined';

export type OtpFlow = 'existingCustomer' | 'newCustomer' | null;

export type CheckoutChoice = 'rewards' | 'normal';

export type LoadingAction =
  | ''
  | 'requestOtp'
  | 'verifyOtp'
  | 'resendOtp'
  | 'createCustomer'
  | 'applyRewards'
  | 'removeRewards';

export type CustomerBalance = {
  id: string;
  loyalty_id: string;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  loyalty_reward: number;
  xp_reward: number;
  stamp_balance: number;
};

export type RequestOtpPayload = {
  loyaltyId: string;
  storeDomain: string;
};

export type RequestOtpResponse = {
  sessionId: string;
};

export type VerifyOtpPayload = {
  sessionId: string;
  otp: string;
  phone: string;
};

export type CreateCustomerPayload = {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  storeDomain: string;
};

export type BalanceResponse = {
  data: {
    data: CustomerBalance;
  };
};

export type CreateCustomerForm = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  acceptTerms: boolean;
};
