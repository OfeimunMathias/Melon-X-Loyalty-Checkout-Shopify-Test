
export type Step =
  | 'loyalty'
  | 'otp'
  | 'createCustomer'
  | 'rewards'
  | 'joined'
  | 'coreExisting'
  | 'coreNew';

export type OtpFlow =
  | 'unverifiedIncomplete'
  | 'verifiedIncomplete'
  | 'verifiedComplete'
  | null;

export type CheckoutChoice = 'rewards' | 'normal';




export type RequestOtpResponse = {
  sessionId?: string;
  profileCompleted: boolean;
  phoneVerified: boolean;
  message: string
};





export type CreateCustomerForm = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  acceptTerms: boolean;
};


export type LoadingAction =
  | ''
  | 'requestOtp'
  | 'verifyOtp'
  | 'resendOtp'
  | 'createCustomer'
  | 'generateVoucher'
  | 'applyRewards'
  | 'removeRewards'
  | 'coreEarn';



export type CreateCustomerNewPayload = {
  phone: string;
  storeDomain: string;
};

export type Notice = {
  type: 'success' | 'error';
  message: string;
} | null;



export type RequestOtpPayload = {
  phone: string;
  storeDomain: string;
  token: string;
};

export type ResendRegistrationOtpPayload = {
  phone: string;
  storeDomain: string;
  token: string;
};

export type VerifyNewCustomerPayload = {
  phone: string;
  storeDomain: string;
  otp: string;
  token: string;
};

export type CreateCustomerPayload = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  sessionId: string;
  token: string;
};
