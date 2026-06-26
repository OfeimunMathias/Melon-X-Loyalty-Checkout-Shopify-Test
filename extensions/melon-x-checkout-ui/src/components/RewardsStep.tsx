import {
    BlockStack,
    InlineStack,
    InlineSpacer,
    View,
    Text,
    TextField,
    Button,
  } from '@shopify/ui-extensions-react/checkout';

  import type {CheckoutChoice} from '../services/types';

  type RewardsStepProps = {
    availablePoints: number;
    pointsToApply: string;
    checkoutChoice: CheckoutChoice;
    nairaEquivalent: number;
    isLoading: boolean;
    isApplyingRewards: boolean;
    onPointsToApplyChange: (value: string) => void;
    onCheckoutChoiceChange: (value: CheckoutChoice) => void;
    onApplyRewards: () => void;
    onRemoveRewards: () => void;
    onBack: () => void;
  };

  export function RewardsStep({
    availablePoints,
    pointsToApply,
    checkoutChoice,
    nairaEquivalent,
    isLoading,
    isApplyingRewards,
    onPointsToApplyChange,
    onCheckoutChoiceChange,
    onApplyRewards,
    onRemoveRewards,
    onBack,
  }: RewardsStepProps) {
    return (
      <View border="base" borderRadius="large" padding="base">
        <BlockStack spacing="base">
          <Button kind="plain" onPress={onBack}>
            ← Back
          </Button>

          <InlineStack blockAlignment="start">
            <BlockStack spacing="extraTight">
              <Text emphasis="bold">3. Choose how to checkout</Text>

              <Text size="small" appearance="subdued">
                Your Melon X wallet has been verified.
              </Text>
            </BlockStack>

            <InlineSpacer />

            <BlockStack spacing="extraTight">
              <Text size="small" appearance="subdued">
                Available
              </Text>

              <Text emphasis="bold">
                {availablePoints.toLocaleString()} pts
              </Text>
            </BlockStack>
          </InlineStack>

          <View border="base" borderRadius="large" padding="base">
            <BlockStack spacing="extraTight">
              <Text size="small" appearance="subdued">
                Wallet balance
              </Text>
              <Text size="large" emphasis="bold">
                {availablePoints.toLocaleString()} points
              </Text>
              <Text size="small" appearance="subdued">
                Estimated value: ₦{availablePoints.toLocaleString()}
              </Text>
            </BlockStack>
          </View>

          <InlineStack spacing="base">
            <Button
              kind={checkoutChoice === 'rewards' ? 'primary' : 'secondary'}
              onPress={() => onCheckoutChoiceChange('rewards')}
            >
              Use Rewards
            </Button>

            <Button
              kind={checkoutChoice === 'normal' ? 'primary' : 'secondary'}
              onPress={onRemoveRewards}
              disabled={isLoading}
            >
              Skip
            </Button>
          </InlineStack>

          {checkoutChoice === 'rewards' ? (
            <BlockStack spacing="base">
              <TextField
                label="Points to use"
                value={pointsToApply}
                onChange={(value) => {
                  onPointsToApplyChange(value.replace(/\D/g, ''));
                }}
                // placeholder="Enter points e.g. 10000"
              />

              <View border="base" borderRadius="large" padding="base">
              <InlineStack blockAlignment="center">
                  <Text>Naira equivalent</Text>

                  <InlineSpacer />

                  <Text emphasis="bold">
                    ₦{nairaEquivalent.toLocaleString()}
                  </Text>
                </InlineStack>
              </View>

              <Text size="small" appearance="subdued">
                1 point = ₦1. The discount will be applied by the Melon X Shopify
                Function.
              </Text>

              <Button kind="primary" onPress={onApplyRewards} disabled={isLoading}>
                {isApplyingRewards ? 'Applying...' : 'Apply Rewards'}
              </Button>
            </BlockStack>
          ) : null}
        </BlockStack>
      </View>
    );
  }
