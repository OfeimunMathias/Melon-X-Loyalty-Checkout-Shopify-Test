import {
    BlockStack,
    InlineStack,
    View,
    Text,
    TextField,
    Button,
    Banner,
  } from '@shopify/ui-extensions-react/checkout';
import { Notice } from '../services/auth/types';

  type OtpStepProps = {
    otp: string;
    resendCountdown: number;
    formattedCountdown: string;
    isLoading: boolean;
    isVerifying: boolean;
    isResending: boolean;
    onOtpChange: (value: string) => void;
    onVerifyOtp: () => void;
    onClearOtp: () => void;
    onResendOtp: () => void;
    onBack: () => void;
    notice:Notice;
  };

  export function OtpStep({
    otp,
    resendCountdown,
    formattedCountdown,
    isLoading,
    isVerifying,
    isResending,
    onOtpChange,
    onVerifyOtp,
    onClearOtp,
    onResendOtp,
    onBack,
    notice
  }: OtpStepProps) {
    return (
      <View border="base" borderRadius="large" padding="base">
        <BlockStack spacing="base">
          {resendCountdown <= 0 ? (
            <Button kind="plain" onPress={onBack}>
              ← Back
            </Button>
          ) : null}

{notice ? (
          <Banner
            status={notice.type === 'error' ? 'critical' : 'success'}
            title={
              notice.type === 'error'
                ? 'Something went wrong'
                : 'Success'
            }
          >
            {notice.message}
          </Banner>
        ) : null}


          <BlockStack spacing="extraTight">
            <Text emphasis="bold">2. Enter OTP</Text>
            <Text size="small" appearance="subdued">
              Enter the 4-digit code sent to your phone number.
            </Text>
          </BlockStack>

          <TextField
              label="Enter 4-digit OTP"
              value={otp}
              onChange={(value) => {
                const numeric = value.replace(/\D/g, '').slice(0, 4);
                onOtpChange(numeric);
              }}
            />

          <InlineStack spacing="base">
            <Button kind="secondary" onPress={onClearOtp} disabled={isLoading}>
              Clear
            </Button>

            <Button
              kind="primary"
              onPress={onVerifyOtp}
              disabled={otp.length !== 4 || isLoading}
            >
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </InlineStack>

          <Button
            kind="plain"
            onPress={onResendOtp}
            disabled={isLoading || resendCountdown > 0}
          >
            {resendCountdown > 0
              ? `Resend in ${formattedCountdown}`
              : isResending
                ? 'Resending...'
                : 'Resend OTP'}
          </Button>
        </BlockStack>
      </View>
    );
  }
