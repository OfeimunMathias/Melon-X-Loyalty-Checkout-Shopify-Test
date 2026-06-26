import {
    BlockStack,
    InlineStack,
    InlineSpacer,
    View,
    Text,
    TextField,
    Button,
    Banner,
  } from '@shopify/ui-extensions-react/checkout';

  import type {CheckoutChoice, Notice} from '../services/auth/types';
import { useState } from 'react';


  type RewardsStepProps = {
    availablePoints: number;
    pointsToApply: string;
    checkoutChoice: CheckoutChoice;
    isLoading: boolean;
    isApplyingRewards: boolean;
    isRemovingRewards: boolean;
    onPointsToApplyChange: (value: string) => void;
    onCheckoutChoiceChange: (value: CheckoutChoice) => void;
    onRemoveRewards: () => void;
    onBack: () => void;
    programName: string;
    pointsInitiated:boolean;
    pointsPerNaira: number;
    voucherGenerated: boolean;
    voucherCode: string;
    discountApplied: boolean;
    isGeneratingVoucher: boolean;
    onVoucherCodeChange: (value: string) => void;
    onGenerateVoucher: () => void;
    onApplyRewards: () => void;
    onVoucherReset: () => void;
    notice:Notice;
    pointsToEarn: number;
    error:string
  };

  export function RewardsStep({
    availablePoints,
    pointsToApply,
    checkoutChoice,
    isLoading,
    isApplyingRewards,
    isGeneratingVoucher,
    voucherGenerated,
    voucherCode,
    pointsPerNaira,
    discountApplied,
    onPointsToApplyChange,
    onCheckoutChoiceChange,
    onApplyRewards,
    onRemoveRewards,
    onBack,
    onVoucherReset,
    onGenerateVoucher,
    onVoucherCodeChange,
    pointsInitiated,
    programName,
    notice,
    pointsToEarn,
    isRemovingRewards,
    error
  }: RewardsStepProps)  {

    const [formattedPoints, setFormattedPoints] = useState('');
    const livePointsNumber = Number(pointsToApply || 0);
const liveNairaEquivalent =
  pointsPerNaira > 0 ? livePointsNumber / pointsPerNaira : 0;

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
                Your {programName} wallet has been verified.
              </Text>
            </BlockStack>

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


            <InlineSpacer />

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
 {isRemovingRewards && (<Text>Initiating points...</Text>)}

{pointsInitiated && pointsToEarn > 0 ? (
  <Text emphasis="bold">
    You will earn {pointsToEarn.toLocaleString()} Loyalty Coins from this transaction. Check your Melon App after checkout.
  </Text>
) : pointsInitiated && pointsToEarn === 0 ?  (
  <Text>
    No active offer on {programName}  Programme. Your order did not qualify, spend something more.
  </Text>
):  error ? (
  <Text>{error}</Text>
) : null}

            <InlineStack spacing="base">
                  <Button
                    kind={checkoutChoice === 'rewards' ? 'primary' : 'secondary'}
                    onPress={() => onCheckoutChoiceChange('rewards')}
                  >
                    <View padding="tight">
                      <BlockStack spacing="extraTight">
                        <Text emphasis="bold">
                          Use {programName || 'Rewards'}
                        </Text>

                        <Text size="small" appearance="subdued">
                        Apply your rewards to reduce your total. You can use any amount up
                        to your available balance.
                        </Text>
                      </BlockStack>
                    </View>
                  </Button>

                  {!voucherGenerated && (
                    <Button
                      kind={checkoutChoice === 'normal' ? 'primary' : 'secondary'}
                      onPress={onRemoveRewards}
                      disabled={isLoading}
                    >
                      <View padding="tight">
                        <BlockStack spacing="extraTight">
                          <Text emphasis="bold">
                            Skip & Checkout Normally
                          </Text>

                          <Text size="small" appearance="subdued">
                          Continue without using rewards. You will still earn points on this purchase and
                          can redeem them later.
                          </Text>
                        </BlockStack>
                      </View>
                    </Button>
                  )}
                </InlineStack>


          {checkoutChoice === 'rewards' ? (

            <BlockStack spacing="base">

{!voucherGenerated && !discountApplied && (
            <>
               <TextField
                    label="Points to use"
                    value={formattedPoints}
                    onChange={(value) => {
                      const raw = value.replace(/[^\d]/g, '');
                      setFormattedPoints(
                        raw ? Number(raw).toLocaleString() : ''
                      );
                      onPointsToApplyChange(raw);
                      onVoucherReset();
                    }}
                  />
                          <Button
                            disabled={isGeneratingVoucher}
                            onPress={onGenerateVoucher}
                          >
                            {isGeneratingVoucher ? 'Generating...' : 'Generate Voucher'}
                          </Button>
                          </>
)}

                {voucherGenerated && !discountApplied ? (
                  <>
                    <TextField
                      label="Voucher code"
                      value={voucherCode}
                      onChange={onVoucherCodeChange}
                      onBlur={() => onVoucherCodeChange(voucherCode.trim())}
                    />
                   <Button
                        disabled={isApplyingRewards}
                        onPress={() => {
                          onApplyRewards();
                        }}
                      >
                        {isApplyingRewards ? 'Applying...' : 'Apply Rewards'}
                      </Button>
                        </>
                ) : null}
            </BlockStack>
          ) : null}

<View border="base" borderRadius="large" padding="base">
              <InlineStack blockAlignment="center">
                  <Text>Naira equivalent</Text>

                  <InlineSpacer />

                  <Text emphasis="bold">
                  ₦{liveNairaEquivalent.toLocaleString()}
                  </Text>
                </InlineStack>
              </View>

              <Text size="small" appearance="subdued">
                1 point = ₦1. The discount will be applied by {programName} rewards programme.
              </Text>

              <Text size="small" appearance="subdued">
                  {pointsPerNaira.toLocaleString()} points = ₦1.
                </Text>

        </BlockStack>
      </View>
    );
  }
