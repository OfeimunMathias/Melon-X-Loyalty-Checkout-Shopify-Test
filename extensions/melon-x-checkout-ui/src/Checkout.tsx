
import {
  reactExtension,
  BlockStack,
  InlineStack,
  View,
  Text,
  Banner,
  useApi,
  useApplyAttributeChange,
  useCartLines,
  Image,
  useTotalAmount,
  Button,
  useAttributes,
  Link,
  useSettings
} from '@shopify/ui-extensions-react/checkout';
import React, {useEffect, useMemo, useState} from 'react';
import { MelonCoreRedirect } from './components/MelonRedirect';

import authServices from './services/auth/auth';
import {
  validatePhone,
  validateCreateCustomer,
} from './services/auth/schema';

import {LoyaltyStep} from './components/LoyaltyStep';
import {OtpStep} from './components/OtpStep';
import {CreateCustomerStep} from './components/CreateCustomerStep';
import {RewardsStep} from './components/RewardsStep';
import { setMelonConfig,getMelonStoreDomain} from './services/api';
import type {
  Step,
  OtpFlow,
  CheckoutChoice,
  LoadingAction,
} from './services/auth/types'
import discountServices from './services/discount/discount';
import { CustomerBalance, Program } from './services/discount/types';
import { Joined } from './components/Joined';
import { ExistingUserWithZeroPoints } from './components/existingUserWithZeroPoints';
import { MelonCoreExistingUser } from './components/MelonCoreExistingUser';
import { MelonCoreNewUser } from './components/MelonCoreNewUser';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <MelonXCheckout />,
);


export const thankYouBlock = reactExtension(
  'purchase.thank-you.block.render',
  () => <MelonXThankYouRewards />,
);

class ExtensionErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {error: Error | null}
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {error: null};
  }

  static getDerivedStateFromError(error: Error) {
    return {error};
  }

  componentDidCatch(error: Error) {
    console.error('Melon X checkout extension crashed:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <Banner status="critical" title="Melon X extension error">
          <BlockStack spacing="tight">
            <Text>{this.state.error.message}</Text>
            <Text size="small" appearance="subdued">
              Check the browser console for the full stack trace.
            </Text>
          </BlockStack>
        </Banner>
      );
    }

    return this.props.children;
  }
}

function MelonXCheckout() {

  const {shop, buyerIdentity, checkoutToken} = useApi();
  const cartLines = useCartLines();
  const totalAmount = useTotalAmount();
  // 2. Inside MelonXCheckout(), replace the hardcoded line (~line 172):
const settings = useSettings();
    const shopifyAppUrl = (settings.shopify_app_url as string) ?? '';
    // 3. Add a loading state near your other useState declarations:
    const [configLoading, setConfigLoading] = useState(true);
    const [configError, setConfigError] = useState('');

  const originalAmount = Number(totalAmount?.amount || 0);

  const cartHash = checkoutToken?.current || '';
  const currency =
    totalAmount?.currencyCode || 'NGN';


    const productDetails = cartLines.map((line) => {
      const merchandise = line.merchandise;

      return {
        productId:
          'product' in merchandise
            ? merchandise.product.id
            : merchandise.id,

        productName:
          merchandise.title ||
          ('product' in merchandise ? merchandise.product.title : '') ||
          'Unknown Product',

        quantity: line.quantity,

        sku:
          'sku' in merchandise
            ? merchandise.sku || undefined
            : undefined,
      };
    });



  const storeDomain = shop.myshopifyDomain;
  console.log('storeDomain',storeDomain)
  const applyAttributeChange = useApplyAttributeChange();

  const [step, setStep] = useState<Step>('loyalty');
  const [phone, setPhone] = useState('');
  const [pointsToApply, setPointsToApply] = useState('');
  const [otp, setOtp] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>('');
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otpFlow, setOtpFlow] = useState<OtpFlow>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [checkoutChoice, setCheckoutChoice] = useState<CheckoutChoice>('rewards');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [pointsPerNaira, ] = useState(1);
  const [voucherGenerated, setVoucherGenerated] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [melonType, setMelonType] = useState<'core' | 'stack' | null>(null);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [pointsInitiated, setPointsInitiated] = useState(false);

  const [showDiscountSuccessScreen, setShowDiscountSuccessScreen] = useState(false);
  const [appliedReward, setAppliedReward] = useState<{
    points: number;
    discountAmount: number;
    voucherCode: string;
  } | null>(null);
  const [pointsToEarn, setPointsToEarn] = useState(0);

  function requireApiToken() {
    if (!apiToken) {
      throw new Error('Melon API token is missing. Please reconnect Melon.');
    }

    return apiToken;
  }

  useEffect(() => {
    if (!shopifyAppUrl) return; // wait for settings to load

    async function loadMelonConfig() {
      try {
        const response = await fetch(
          `${shopifyAppUrl}/api/melon-config?shop=${encodeURIComponent(storeDomain)}`
        );
        const data = await response.json();
        if (!response.ok || !data.token) {
          throw new Error(data.error || 'Failed to load Melon config');
        }
        setApiToken(data.token);
        setMelonType(data.melonType);
        setMelonConfig({
          token: data.token,
          melonType: data.melonType,
          shop: storeDomain,
          shopifyAppUrl: shopifyAppUrl,
          storeDomain: storeDomain,
        });
      } catch (err) {
        setConfigError(err instanceof Error ? err.message : 'Failed to load Melon config');
      } finally {
        setConfigLoading(false);
      }
    }
    loadMelonConfig();
  }, [storeDomain, shopifyAppUrl]);


  const billingEmail = buyerIdentity?.email?.current || email || '';

  const pointsNumber = Number(pointsToApply || 0);

  const reward = Number(balance?.loyalty_reward ?? 0);

const redeemedPoints = appliedReward?.points || 0;

  const availablePoints = Math.max(
    0,
    reward - redeemedPoints
  );

  const nairaEquivalent = pointsNumber / pointsPerNaira;

  console.log('availablePoints',availablePoints)

  console.log('redeemedDetails', {
    sessionId,
    originalAmount:Math.round(originalAmount),
    cartHash,
    pointsToRedeem: pointsNumber,
    voucherCode: voucherCode.trim(),
    currency,
    billingEmail,
    billingPhone: verifiedPhone,
    productDetails,
    platform: 'shopify',
  });


  async function setupCoreEarn(activeSessionId: string, token: string) {

    console.log('setupCoreEarn called with:', {
      activeSessionId,
      token: token?.slice(0, 20),
      originalAmount,
      cartHash,
      billingEmail,
      billingPhone: verifiedPhone,
    });

    try {
     await discountServices.getBalance(activeSessionId);
      const pointsResponse = await discountServices.getPointsToEarn({
        sessionId: activeSessionId,
        token,
        originalAmount
      });
      console.log('pointsResponse:', pointsResponse);

      const earnedPoints =
        pointsResponse?.pointsToEarn ??
        pointsResponse?.data?.pointsToEarn ??
        0;

      setPointsToEarn(earnedPoints);
      setPointsInitiated(true);

      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'melonx_points_to_earn',
        value: String(earnedPoints),
      });

      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'melonx_program_name',
        value: program?.program_name || 'Melon X',
      });

      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'melonx_type',
        value: melonType ,
      });

      console.log('calling redeemPoints with:', {
        sessionId: activeSessionId,
        originalAmount,
        cartHash,
        billingEmail,
        billingPhone: verifiedPhone,
      });

      await discountServices.redeemPoints({
        sessionId: activeSessionId,
        originalAmount,
        cartHash,
        voucherCode: Date.now().toString(),
        currency,
        // token: requireApiToken(),
        billingEmail,
        billingPhone: verifiedPhone,
        productDetails,
        platform: 'shopify',
      });

      console.log('redeemPoints completed');
      return earnedPoints;
    } catch (err) {
      console.error('setupCoreEarn error:', err);
      throw err;
    } finally {
      setLoadingAction('');
    }
  }

  const isLoading = loadingAction !== '';

  function resetVoucherState() {
    setVoucherGenerated(false);
    setVoucherCode('');
    setDiscountApplied(false);
  }

  async function generateVoucher() {
    resetMessages();

    if (pointsNumber <= 0) {
      showError('Please enter points to apply.');
      return;
    }

    if (pointsNumber > availablePoints) {
      showError('You cannot apply more than your available points.');
      return;
    }

    setLoadingAction('generateVoucher');

    try {
      const response = await discountServices.generateVoucher({
        sessionId,
        originalAmount,
        pointsToRedeem: pointsNumber,
        token: requireApiToken(),
      });


      setVoucherGenerated(true);
      setVoucherCode('');
      showSuccess(
        response?.message ||
          'Voucher generated successfully. Enter the voucher code sent to your phone.',
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate voucher');
    } finally {
      setLoadingAction('');
    }
  }

  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  function showSuccess(message: string) {
    setNotice({type: 'success', message});
  }

  function showError(message: string) {
    setNotice({type: 'error', message});
  }

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      setNotice(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [notice]);


  function resetMessages() {
    setNotice(null);
  }

  async function requestOtp() {
    resetMessages();

    const parsed = validatePhone(phone);

    if (!parsed.success) {
      showError(parsed.message);
      return;
    }

    setLoadingAction('requestOtp');

    console.log( 'requestOtpObject', {
      phone: parsed.data,
      storeDomain: getMelonStoreDomain(),
      token: requireApiToken(),
    })

    try {
      const data = await authServices.requestOtp({
        phone: parsed.data,
        storeDomain: getMelonStoreDomain(),
        token: requireApiToken(),
      });



      setSessionId(data.sessionId || '');
      setVerifiedPhone(parsed.data);
      setOtp('');
      setStep('otp');
      setResendCountdown(60);
      setVoucherGenerated(false);
      setVoucherCode('');
      setDiscountApplied(false);
      setAppliedReward(null);
      setShowDiscountSuccessScreen(false);
      setPointsToEarn(0);

      if (!data.profileCompleted && !data.phoneVerified) {
        setOtpFlow('unverifiedIncomplete');
      } else if (!data.profileCompleted && data.phoneVerified) {
        setOtpFlow('verifiedIncomplete');
      } else if (data.profileCompleted && data.phoneVerified) {
        setOtpFlow('verifiedComplete');
      }

      showSuccess(data.message || 'OTP sent successfully.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoadingAction('');
    }
  }

  async function resendOtp() {
    resetMessages();

    if (resendCountdown > 0) return;

    const parsed = validatePhone(verifiedPhone || phone);

    if (!parsed.success) {
      showError('Please enter your loyalty phone number first.');
      return;
    }

    setLoadingAction('resendOtp');

    try {
      const data =
      otpFlow === 'unverifiedIncomplete'
        ? await authServices.resendRegistrationOtp({
            phone: parsed.data,
            storeDomain: getMelonStoreDomain(),
              token: requireApiToken(),
          })
        : await authServices.requestOtp({
            phone: parsed.data,
            storeDomain: getMelonStoreDomain(),
              token: requireApiToken(),
          });

      if (data?.sessionId) {
        setSessionId(data.sessionId);
      }

      setVerifiedPhone(parsed.data);
      setResendCountdown(60);
      showSuccess('OTP resent successfully.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoadingAction('');
    }
  }

  async function createCustomer() {
    resetMessages();

    const parsed = validateCreateCustomer({
      firstName,
      lastName,
      email,
      dateOfBirth,
      acceptTerms,
    });

    if (!parsed.success) {
      showError(parsed.message);
      return;
    }

    setLoadingAction('createCustomer');

    if (!sessionId) {
      showError('Session expired. Please verify your phone again.');
      setStep('loyalty');
      return;
    }

    try {
      const data = await authServices.completeProfile({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        dateOfBirth: parsed.data.dateOfBirth,
        sessionId,
        token: requireApiToken(),
      });
      if (data?.sessionId) {
        setSessionId(data.sessionId);
      }
      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'melonx_new_customer_joined',
        value: '1',
      });
      setOtp('');
      const activeToken = requireApiToken();
      // ✅ Set step immediately, run setupCoreEarn after
      if (melonType === 'core') {
        setStep('coreNew');         // show screen immediately
        showSuccess('Registration completed successfully.');
        setLoadingAction('coreEarn');

        const activeSessionId = data.sessionId || sessionId;

        try {
          const programResponse = await discountServices.getProgramDetails(activeSessionId);
          setProgram(programResponse.data);
        } catch (err) {
          console.error('Failed to fetch program details for new core user:', err);

        }

        await setupCoreEarn(data.sessionId || sessionId, activeToken); // runs in background
        return;
      }
      setStep('joined');
      showSuccess('Registration completed successfully.');
      setLoadingAction('coreEarn');
      await setupCoreEarn(data.sessionId || sessionId, activeToken);

    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create account');
    }
  }

async function verifyOtp() {
  resetMessages();

  if (otp.length !== 4) {
    showError('Please enter a 4-digit OTP.');
    return;
  }

  setLoadingAction('verifyOtp');

  try {
    const verifyResponse = await authServices.verifyNewCustomer({
      phone: verifiedPhone,
      storeDomain: getMelonStoreDomain(),
      otp,
      token: requireApiToken(),
    });

    const activeSessionId = verifyResponse?.sessionId || sessionId;

    if (verifyResponse?.sessionId) {
      setSessionId(verifyResponse.sessionId);
    }

    setOtp('');

    if (
      otpFlow === 'unverifiedIncomplete' ||
      otpFlow === 'verifiedIncomplete'
    ) {
      setStep('createCustomer');
      showSuccess('OTP verified successfully.');
      return;
    }

    if (melonType === 'core') {
      setStep('coreExisting');
      setLoadingAction('coreEarn');
    } else {
      setStep('rewards');
      setLoadingAction('');
    }

    showSuccess('OTP verified successfully.');

    // ✅ Run data fetching IN THE BACKGROUND after step change
    const [balanceResponse, programResponse, pointsRateResponse] =
      await Promise.all([
        discountServices.getBalance(activeSessionId),
        discountServices.getProgramDetails(activeSessionId),
        // discountServices.getPointsRate(),
      ]);

    setBalance(balanceResponse.data);
    setProgram(programResponse.data);
    // setPointsPerNaira(pointsRateResponse.rate || 1);

    if (melonType === 'core') {
      const token = requireApiToken();
      setLoadingAction('coreEarn');
      await setupCoreEarn(activeSessionId, token);
    }

  } catch (err) {
    showError(err instanceof Error ? err.message : 'Failed to verify OTP');
    setLoadingAction('');
  }
}


  async function applyRewards() {
    resetMessages();

    console.log('redeemedDetails',{
      sessionId,
      originalAmount:Math.round(originalAmount),
      pointsToRedeem: pointsNumber,
      voucherCode: voucherCode.trim(),
      currency,
      billingEmail,
      billingPhone: verifiedPhone,
      productDetails,
      platform: 'shopify',
    })

    if (!voucherGenerated) {
      showError('Please generate a voucher first.');
      return;
    }

    if (!voucherCode.trim()) {
      showError('Please enter the voucher code sent to your phone.');
      return;
    }

    if (pointsNumber <= 0) {
      showError('Please enter points to apply.');
      return;
    }

    if (pointsNumber > availablePoints) {
      showError('You cannot apply more than your available points.');
      return;
    }

    setLoadingAction('applyRewards');

    try {

      const pointsToEarnResponse = await discountServices.getPointsToEarn({
        sessionId,
        token: requireApiToken(),
        originalAmount,
        voucherCode: voucherCode.trim(),
      });

      const earnedPoints =
        pointsToEarnResponse?.pointsToEarn ??
        pointsToEarnResponse?.data?.pointsToEarn ??
        0;

      setPointsToEarn(earnedPoints);

      const attributes = [
        ['melonx_points', String(pointsNumber)],
        ['melonx_session_id', sessionId],
        ['melonx_phone', verifiedPhone],
        ['melonx_voucher_code', voucherCode.trim()],
        ['melonx_discount_amount', String(nairaEquivalent)],
        ['melonx_points_to_earn', String(earnedPoints)],
        ['melonx_program_name', program?.program_name || 'Melon X'],
        ['melonx_type', melonType ],
      ];
      // 1. Apply Shopify checkout attributes first
      for (const [key, value] of attributes) {

        const result = await applyAttributeChange({
          type: 'updateAttribute',
          key,
          value,
        });

        console.log('Applying attribute:', key, value);
        console.log('Attribute result:', result);

        if (result.type === 'error') {
          throw new Error(result.message);
        }
      }



      // 3. Redeem points only after Shopify accepted the checkout attributes
      console.log('BEFORE redeemPoints');
    const finalAmount = originalAmount - nairaEquivalent
      try {
        const redeemResponse =  await discountServices.redeemPoints({
          sessionId,
          originalAmount:finalAmount,
          cartHash,
          pointsToRedeem: pointsNumber,
          voucherCode: voucherCode.trim(),
          currency,
          billingEmail,
          billingPhone: verifiedPhone,
          // token: requireApiToken(),
          productDetails,
          platform: 'shopify',
        });
        console.log('redeemPoints success check', redeemResponse);

        showSuccess(
          `₦${nairaEquivalent.toLocaleString()} ${
            program?.program_name || 'Melon X'
          } discount has been applied.`,
        );
        setAppliedReward({
          points: pointsNumber,
          discountAmount: nairaEquivalent,
          voucherCode: voucherCode.trim(),
        });
        setShowDiscountSuccessScreen(true);
      } catch (err) {
        console.error('Error during redeemPoints, proceeding to show error message:', err);
        showError(
          err instanceof Error
            ? err.message
            : 'Failed to redeem points on this checkout.',
        );
      }
    // 2. Mark UI discount as applied
        setDiscountApplied(true);
        setPointsInitiated(true);

    } catch (err) {
      setDiscountApplied(false);

      showError(
        err instanceof Error
          ? err.message
          : 'Unable to apply rewards on this checkout.',
      );
    } finally {
      setLoadingAction('');
    }
  }
 async function removeRewards() {
    resetMessages();
    setLoadingAction('removeRewards');
    try {
      setPointsToApply('');
      setCheckoutChoice('normal');
      resetVoucherState();

   // Get earnable points WITHOUT voucher
    const pointsResponse =
    await discountServices.getPointsToEarn({
      sessionId,
      token: requireApiToken(),
      originalAmount
    });

  const pointsToEarn =
    pointsResponse?.pointsToEarn ??
    pointsResponse?.data?.pointsToEarn ??
    0;


  setPointsToEarn(pointsToEarn);
  setPointsInitiated(true);


    await applyAttributeChange({
      type: 'updateAttribute',
      key: 'melonx_points_to_earn',
      value: String(pointsToEarn),
    });

    await applyAttributeChange({
      type: 'updateAttribute',
      key: 'melonx_program_name',
      value: program?.program_name || 'Melon X',
    });

    await applyAttributeChange({
      type: 'updateAttribute',
      key: 'melonx_type',
      value: melonType ,
    });

      const voucherCode = Date.now().toString();
      const response =  await discountServices.redeemPoints({
        sessionId,
        originalAmount,
        cartHash,
        voucherCode,
        currency,
        billingEmail,
        billingPhone: verifiedPhone,
        // token: requireApiToken(),
        productDetails,
        platform: 'shopify',
      });
      showSuccess(` ${response.message} `);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to remove rewards.');
    } finally {
      setLoadingAction('');
    }
  }


  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const formattedCountdown = useMemo(() => {
    const mins = Math.floor(resendCountdown / 60);
    const secs = resendCountdown % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [resendCountdown]);

  if (showDiscountSuccessScreen && appliedReward) {

    return (
      <View border="base" borderRadius="large" padding="loose">
        <BlockStack spacing="loose" inlineAlignment="center">
          <View
            border="base"
            borderRadius="fullyRounded"
            padding="base"
            background="subdued"
          >
            <Text size="extraLarge" emphasis="bold">
              ✓
            </Text>
          </View>

          <BlockStack spacing="tight" inlineAlignment="center">
            <Text size="large" emphasis="bold">
              Your Discount was successfully applied please proceed to checkout and
              make payment with your payment provider
            </Text>

            <Text size="medium" appearance="subdued">
              ₦{appliedReward.discountAmount.toLocaleString()}{' '}
              {program?.program_name || 'Melon X'} discount applied
            </Text>
          </BlockStack>

          <Button
             kind="primary"
            onPress={() => setShowDiscountSuccessScreen(false)}
          >
            Close
          </Button>
        </BlockStack>
      </View>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'coreExisting':
  return (
        <MelonCoreExistingUser
          storeName={program?.program_name || storeDomain}
          pointsToEarn={pointsToEarn}
          pointsInitiated={pointsInitiated}
          isLoading={loadingAction === 'coreEarn'}
          error={notice?.type === 'error' ? notice.message : ''}
        />
      );

    case 'coreNew':
      return <MelonCoreNewUser  storeName={program?.program_name || storeDomain} />;

      case 'loyalty':
        return (
          <LoyaltyStep
            phone={phone}
            onPhoneChange={setPhone}
            onRequestOtp={requestOtp}
            isLoading={loadingAction === 'requestOtp'}
            notice={notice}
            melonType={melonType}
          />
        );

      case 'createCustomer':
        return (
          <CreateCustomerStep
            firstName={firstName}
            lastName={lastName}
            email={email}
            dateOfBirth={dateOfBirth}
            acceptTerms={acceptTerms}
            isLoading={loadingAction === 'createCustomer'}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onEmailChange={setEmail}
            onDateOfBirthChange={setDateOfBirth}
            onAcceptTermsChange={setAcceptTerms}
            onCreateCustomer={createCustomer}
            onBack={() => setStep('loyalty')}
            notice={notice}
          />
        );

      case 'otp':
        return (
          <OtpStep
            otp={otp}
            resendCountdown={resendCountdown}
            formattedCountdown={formattedCountdown}
            isLoading={isLoading}
            isVerifying={loadingAction === 'verifyOtp'}
            isResending={loadingAction === 'resendOtp'}
            onOtpChange={setOtp}
            onVerifyOtp={verifyOtp}
            onClearOtp={() => setOtp('')}
            onResendOtp={resendOtp}
            onBack={() => setStep('loyalty')}
            notice={notice}
          />
        );

      case 'joined':
        return (
          <Joined
            storeName={program?.program_name || storeDomain}
          />
        );

      case 'rewards':

      if (loadingAction === 'coreEarn' || balance === null) {
        return (
          <Banner status="info" title="Loading your rewards...">
            <BlockStack spacing="tight">
              <Text appearance="subdued">Please wait a moment.</Text>
            </BlockStack>
          </Banner>
        );
      }

        if (availablePoints <= 0) {
          return (
            <ExistingUserWithZeroPoints
              storeName={program?.program_name || storeDomain}
            />
          );
        }

        return (
          <RewardsStep
            programName={program?.program_name || 'Melon X'}
            availablePoints={availablePoints}
            pointsPerNaira={pointsPerNaira}
            pointsToApply={pointsToApply}
            checkoutChoice={checkoutChoice}
            voucherGenerated={voucherGenerated}
            voucherCode={voucherCode}
            isLoading={isLoading}
            isGeneratingVoucher={loadingAction === 'generateVoucher'}
            isApplyingRewards={loadingAction === 'applyRewards'}
            onPointsToApplyChange={setPointsToApply}
            onCheckoutChoiceChange={setCheckoutChoice}
            onVoucherCodeChange={setVoucherCode}
            onGenerateVoucher={generateVoucher}
            pointsInitiated={pointsInitiated}
            isRemovingRewards={loadingAction === 'removeRewards'}
            onApplyRewards={applyRewards}
            onRemoveRewards={removeRewards}
            onVoucherReset={resetVoucherState}
            onBack={() => setStep('loyalty')}
            discountApplied={discountApplied}
            pointsToEarn={pointsToEarn}
            notice={notice}
            error={notice?.type === 'error' ? notice.message : ''}
          />
        );

      default:
        return null;
    }
  };
  console.log('melonTypeNews', melonType);


  if (configLoading) {
    return (
      <BlockStack spacing="base">
        <Text appearance="subdued">Loading Melon Checkout...</Text>
      </BlockStack>
    );
  }

  if (configError) {
    return (
      <Banner status="critical" title="Melon connection error">
        <Text>{configError}</Text>
      </Banner>
    );
  }

return (
  <View border="base" borderRadius="large" padding="base">
    <BlockStack spacing="loose">

      {/* Don't render header until melonType is known */}
        <InlineStack spacing="base" blockAlignment="center">
          {melonType === 'stack' ? (
            <BlockStack spacing="extraTight">
              <InlineStack spacing="base" blockAlignment="center">
                {program?.interface_design?.logo && (
                  <View maxInlineSize={60}>
                    <Image
                      source={program.interface_design.logo}
                      accessibilityDescription={program.program_name}
                    />
                  </View>
                )}
                <Text size="medium" emphasis="bold">
                  Use {program?.program_name || 'Our Loyalty'} Rewards
                </Text>
              </InlineStack>
              <Text size="small" appearance="subdued">
                Verify your wallet, view your points, and apply rewards to reduce
                your order total.
              </Text>
            </BlockStack>
          ) : (
            <InlineStack spacing="base" blockAlignment="center">
              <Text size="medium" emphasis="bold">
                Get Rewarded for every purchase
              </Text>
            </InlineStack>
          )}
        </InlineStack>

      {/* Only render steps once melonType is known */}
      {renderStep()}

      <BlockStack spacing="tight" inlineAlignment="center">
        <View maxInlineSize={80}>
          <Image
            source="https://res.cloudinary.com/dxpnod1bu/image/upload/v1780307661/melonLogoBlack_mjxugl.png"
            accessibilityDescription="Melon Rewards"
          />
        </View>
        <View maxInlineSize={250} inlineAlignment="start">
          <Text size="small" appearance="subdued" >
            <Text size="small" appearance="subdued">
                {'Powered by Melon Africa, the loyalty provider for modern shoppers.'}
              </Text>
          </Text>
        </View>
      </BlockStack>

    </BlockStack>
  </View>
);
}

function MelonXThankYouRewards() {
  const attributes = useAttributes();

  const getAttribute = (key: string) =>
    attributes.find((attribute) => attribute.key === key)?.value || '';

  const points = Number(getAttribute('melonx_points_to_earn') || '0');
  const isNewCustomer = getAttribute('melonx_new_customer_joined') === '1';
  const programName = getAttribute('melonx_program_name') || 'Melon X';
  const melonType = getAttribute('melonx_type');

  return (
    <Banner  title={points > 0 ? 'Congratulations! 🎉' : ''}>
      <BlockStack spacing="tight">
        {points > 0 ? (
          <Text>
            You have earned {points.toLocaleString()} loyalty coins from this order.
          </Text>
        ) : (
          <Text>
            No active offer on {programName} Programme. Your order did not qualify, spend something more.
          </Text>
        )}

        {melonType === 'stack' ? (
          isNewCustomer && (
            <Link to="https://partner-dev.getmelon.co/onboarding">
              Continue to {programName} dashboard
            </Link>
          )
        ) : (
          <MelonCoreRedirect NewCustomer={false}/>
        )}
      </BlockStack>
    </Banner>
  );
}
