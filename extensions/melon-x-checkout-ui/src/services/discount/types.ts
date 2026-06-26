
export type Program = {
    id: string;
    program_name: string;
    description: string | null;
    interface_design?: {
      logo?: string;
      tagline?: string;
      website_color?: string;
      accent_color?: string;
      terms_conditions?: string;
      privacy_policy?: string;
    };
  };

  export type ProgramDetailsResponse = {
    message: string;
    data: Program;
  };

  export type PointsRateResponse = {
    rate: number;
  };


  export type GenerateVoucherResponse = {
    expectedLoyaltyPoints: number,
    expectedXp:number,
    expectedStamps:number
    message:string
  }

export type BalanceResponse = {
  message: string;
  data: CustomerBalance;
};

export type CustomerBalance = {
  id: string;
  loyalty_id: string;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  opt_in_marketing: boolean;
  opt_in_transactional: boolean;
  program_id: string;
  profile_completed: boolean;
  loyalty_reward: number;
  xp_reward: number;
  stamp_balance: number;
  next_tier_stamp: number | null;
};

  //changes
  export type GenerateVoucherPayload = {
    sessionId: string;
    originalAmount: number;
    pointsToRedeem: number;
    token: string;
  };

  export type GetPointsToEarnPayload = {
    sessionId: string;
    token: string;
    originalAmount: number;
    voucherCode?: string;
  };

  export type PointsToEarnResponse = {
    message?: string;
    pointsToEarn?: number;
    data?: {
      pointsToEarn?: number;
    };
  };

  export type RedeemPointsPayload = {
    sessionId: string;
    originalAmount: number | undefined;
    pointsToRedeem?: number;
    voucherCode?: string;
    reference?: string;
    currency: string;
    billingEmail: string;
    cartHash: string;
    // token:string;
    billingPhone: string;
    productDetails: {
      productId: string;
      productName: string;
      quantity: number;
      sku?: string;
    }[];
    platform: 'shopify';
  };
