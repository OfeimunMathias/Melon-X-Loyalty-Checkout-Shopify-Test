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

  type LoyaltyStepProps = {
    phone: string;
    onPhoneChange: (value: string) => void;
    onRequestOtp: () => void;
    isLoading: boolean;
    notice:Notice;
    melonType: 'core' | 'stack';
  };

  export function LoyaltyStep({
    phone,
    onPhoneChange,
    onRequestOtp,
    isLoading,
    notice,
    melonType
  }: LoyaltyStepProps) {
    return (
      <BlockStack spacing="base">
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

        <View border="base" borderRadius="large" padding="base">
          <BlockStack spacing="base">
          <InlineStack inlineAlignment="start" spacing="base">
              <BlockStack spacing="extraTight">
                <Text emphasis="bold"> 1. Log in or create a loyalty account {melonType === 'stack' ? 'to verify your wallet' : ''}.</Text>
                <Text size="small" appearance="subdued">
                  {/* Enter your phone number. */}
                </Text>
              </BlockStack>

              <Text size="small" appearance="subdued">
                Step 1
              </Text>
            </InlineStack>


            <BlockStack spacing="extraTight">

              <TextField
                label="Phone number"
                value={phone}
                onChange={onPhoneChange}
              />
            </BlockStack>


            <Button kind="primary" onPress={onRequestOtp} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send OTP'}
            </Button>
          </BlockStack>
        </View>
      </BlockStack>
    );
  }
