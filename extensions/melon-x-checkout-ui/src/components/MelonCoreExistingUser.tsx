import {
  Banner,
  BlockStack,
  Text,
} from '@shopify/ui-extensions-react/checkout';

export const MelonCoreExistingUser = ({
  storeName,
  pointsToEarn,
  pointsInitiated,
  isLoading,
  error,
}: {
  storeName: string;
  pointsToEarn: number;
  isLoading: boolean;
  pointsInitiated:boolean;
  error:string;
}) => {
  if (isLoading) {
    return (
      <Banner status="info" title="Setting up your rewards...">
        <BlockStack spacing="tight">
          <Text appearance="subdued">initiating...</Text>
        </BlockStack>
      </Banner>
    );
  }

  return (
    <Banner status="success" >
      <BlockStack spacing="tight">

      {pointsInitiated && pointsToEarn > 0 ? (
  <Text emphasis="bold">
    You will earn {pointsToEarn.toLocaleString()} Loyalty Coins from this transaction. Check your Melon App after checkout.
  </Text>
) : pointsInitiated && pointsToEarn === 0 ?  (
  <Text>
    No active offer on {storeName}  Programme. Your order did not qualify, spend something more.
  </Text>
):  error ? (
  <Text>{error}</Text>
) : null}
      </BlockStack>
    </Banner>
  );
};
