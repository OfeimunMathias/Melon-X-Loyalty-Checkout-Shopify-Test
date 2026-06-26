import {
    BlockStack,
    InlineStack,
    View,
    Text,
    TextField,
    Button,
  } from '@shopify/ui-extensions-react/checkout';

  type LoyaltyStepProps = {
    phone: string;
    onPhoneChange: (value: string) => void;
    onRequestOtp: () => void;
    isLoading: boolean;
  };

  export function LoyaltyStep({
    phone,
    onPhoneChange,
    onRequestOtp,
    isLoading,
  }: LoyaltyStepProps) {
    return (
      <BlockStack spacing="base">
        <View border="base" borderRadius="large" padding="base">
          <BlockStack spacing="base">
          <InlineStack inlineAlignment="start" spacing="base">
              <BlockStack spacing="extraTight">
                <Text emphasis="bold">1. Verify your wallet</Text>
                <Text size="small" appearance="subdued">
                  Enter your Melon phone number.
                </Text>
              </BlockStack>

              <Text size="small" appearance="subdued">
                Step 1
              </Text>
            </InlineStack>


            <BlockStack spacing="extraTight">
              <Text size="small" appearance="subdued">
                Enter your Melon phone number
              </Text>

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
