import '@shopify/ui-extensions/preact';

import {render} from 'preact';
import {useEffect, useMemo, useState} from 'preact/hooks';

import authServices from './services/auth';
import {
  validatePhone,
  validateCreateCustomer,
} from './services/schema';

import {LoyaltyStep} from './components/LoyaltyStep';
import {OtpStep} from './components/OtpStep';
import {CreateCustomerStep} from './components/CreateCustomerStep';
import {RewardsStep} from './components/RewardsStep';

import type {
  Step,
  OtpFlow,
  CheckoutChoice,
  LoadingAction,
  CustomerBalance,
} from './services/types';


export default render(
  'purchase.checkout.block.render',
  () => <MelonXCheckout />,
);


function MelonXCheckout() {
  const {shop} = useApi();
  const buyerEmail = useEmail();
  const applyAttributeChange = useApplyAttributeChange();

  const storeDomain = shop.myshopifyDomain;

  const [step, setStep] = useState<Step>('loyalty');
  const [otpFlow, setOtpFlow] = useState<OtpFlow>(null);

  const [phone, setPhone] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [sessionId, setSessionId] = useState('');
  const [balance, setBalance] = useState<CustomerBalance | null>(null);

  const [pointsToApply, setPointsToApply] = useState('');
  const [checkoutChoice, setCheckoutChoice] =
    useState<CheckoutChoice>('rewards');

  const [resendCountdown, setResendCountdown] = useState(0);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>('');

  const availablePoints = Number(balance?.loyalty_reward || 0);
  const numberOfPointsToOneNaira = 1;

  const pointsNumber = Number(pointsToApply || 0);
  const nairaEquivalent = pointsNumber / numberOfPointsToOneNaira;


  const isLoading = loadingAction !== '';

  useEffect(() => {
    if (buyerEmail && !email) {
      setEmail(buyerEmail);
    }
  }, [buyerEmail, email]);

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

  function resetMessages() {
    setError('');
    setSuccess('');
  }

  async function requestOtp() {
    resetMessages();

     const parsed = validatePhone(phone);;

     if (!parsed.success) {
      setError(parsed.message);
      return;
    }

    setLoadingAction('requestOtp');

    try {
      const data = await authServices.requestOtp({
        loyaltyId: parsed.data,
        storeDomain,
      });

      setSessionId(data.sessionId);
      setVerifiedPhone(parsed.data);
      setOtpFlow('existingCustomer');
      setOtp('');
      setStep('otp');
      setResendCountdown(60);
      setSuccess('OTP sent successfully.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send OTP';

      if (message.toLowerCase().includes('customer not found')) {
        setVerifiedPhone(parsed.data);
        setStep('createCustomer');
        return;
      }

      setError(message);
    } finally {
      setLoadingAction('');
    }
  }

  async function resendOtp() {
    resetMessages();

    if (resendCountdown > 0) return;

    const parsed = validatePhone(verifiedPhone || phone);

    if (!parsed.success) {
      setError('Please enter your loyalty phone number first.');
      return;
    }

    setLoadingAction('resendOtp');

    try {
      const data = await authServices.requestOtp({
        loyaltyId: parsed.data,
        storeDomain,
      });

      setSessionId(data.sessionId);
      setVerifiedPhone(parsed.data);
      setResendCountdown(60);
      setSuccess('OTP resent successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
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
      setError(parsed.message);
      return;
    }

    setLoadingAction('createCustomer');

    try {
      const data = await authServices.createCustomer({
        phone: verifiedPhone,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        dateOfBirth: parsed.data.dateOfBirth,
        storeDomain,
      });

      setSessionId(data.sessionId);
      setOtpFlow('newCustomer');
      setOtp('');
      setStep('otp');
      setResendCountdown(60);
      setSuccess(
        'Registration successful. Please verify your phone with the OTP sent to your number.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoadingAction('');
    }
  }

  async function verifyOtp() {
    resetMessages();

    if (otp.length !== 4) {
      setError('Please enter a 4-digit OTP.');
      return;
    }

    setLoadingAction('verifyOtp');

    try {
      await authServices.verifyOtp({
        sessionId,
        otp,
        phone: verifiedPhone,
      });

      if (otpFlow === 'newCustomer') {
        setOtp('');
        setStep('joined');
        setSuccess('Phone verified successfully.');
        return;
      }

      const balanceResponse = await authServices.getBalance(sessionId);

      setBalance(balanceResponse.data.data);
      setOtp('');
      setStep('rewards');
      setSuccess('Wallet verified successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoadingAction('');
    }
  }

  async function applyRewards() {
    resetMessages();

    if (pointsNumber <= 0) {
      setError('Please enter points to apply.');
      return;
    }

    if (pointsNumber > availablePoints) {
      setError('You cannot apply more than your available points.');
      return;
    }

    setLoadingAction('applyRewards');

    try {
      const pointsResult = await applyAttributeChange({
        type: 'updateAttribute',
        key: 'melonx_points',
        value: String(pointsNumber),
      });

      if (pointsResult.type === 'error') {
        throw new Error(pointsResult.message);
      }

      const sessionResult = await applyAttributeChange({
        type: 'updateAttribute',
        key: 'melonx_session_id',
        value: sessionId,
      });

      if (sessionResult.type === 'error') {
        throw new Error(sessionResult.message);
      }

      const phoneResult = await applyAttributeChange({
        type: 'updateAttribute',
        key: 'melonx_phone',
        value: verifiedPhone,
      });

      if (phoneResult.type === 'error') {
        throw new Error(phoneResult.message);
      }

      setSuccess(
        `₦${nairaEquivalent.toLocaleString()} Melon X discount will be applied.`,
      );
    } catch (err) {
      setError(
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
      const result = await applyAttributeChange({
        type: 'updateAttribute',
        key: 'melonx_points',
        value: '0',
      });

      if (result.type === 'error') {
        throw new Error(result.message);
      }

      setPointsToApply('');
      setCheckoutChoice('normal');
      setSuccess('Melon X rewards removed.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to remove rewards.',
      );
    } finally {
      setLoadingAction('');
    }
  }

  return (
    <View border="base" borderRadius="large" padding="base">
      <BlockStack spacing="loose">
        <InlineStack spacing="base" blockAlignment="center">
          <View borderRadius="large" padding="tight" background="base">
            <Text emphasis="bold">Melon X</Text>
          </View>

          <BlockStack spacing="extraTight">
            <Text size="medium" emphasis="bold">
              Use Melon X Rewards
            </Text>

            <Text size="small" appearance="subdued">
              Verify your wallet, view your points, and apply rewards to reduce
              your order total.
            </Text>
          </BlockStack>
        </InlineStack>

        {error ? (
          <Banner status="critical" title="Melon X">
            {error}
          </Banner>
        ) : null}

        {success ? (
          <Banner status="success" title="Melon X">
            {success}
          </Banner>
        ) : null}

        {step === 'loyalty' ? (
          <LoyaltyStep
            phone={phone}
            onPhoneChange={setPhone}
            onRequestOtp={requestOtp}
            isLoading={loadingAction === 'requestOtp'}
          />
        ) : null}

        {step === 'createCustomer' ? (
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
          />
        ) : null}

        {step === 'otp' ? (
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
          />
        ) : null}

        {step === 'joined' ? (
          <Banner status="success" title="You’ve joined Store Rewards">
            You’ll earn points from this purchase and future orders.
          </Banner>
        ) : null}

        {step === 'rewards' ? (
          <RewardsStep
            availablePoints={availablePoints}
            pointsToApply={pointsToApply}
            checkoutChoice={checkoutChoice}
            nairaEquivalent={nairaEquivalent}
            isLoading={isLoading}
            isApplyingRewards={loadingAction === 'applyRewards'}
            onPointsToApplyChange={setPointsToApply}
            onCheckoutChoiceChange={setCheckoutChoice}
            onApplyRewards={applyRewards}
            onRemoveRewards={removeRewards}
            onBack={() => setStep('loyalty')}
          />
        ) : null}
      </BlockStack>
    </View>
  );
}
