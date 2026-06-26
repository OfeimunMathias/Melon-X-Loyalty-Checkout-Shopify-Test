import {
    BlockStack,
    InlineStack,
    Image,
    Link,
    Text,
    View,
  } from '@shopify/ui-extensions-react/checkout';


  export const MelonCoreRedirect = ({NewCustomer}:{NewCustomer:boolean}) => {
    return (
      <BlockStack spacing="base">
        <Text>
            {NewCustomer ? 'Download the Melon app to claim your rewards for this transaction and start earning across multiple merchants' : ' Download the Melon app to view and manage your rewards.'}
        </Text>

        <InlineStack spacing="base">
  <Link to="https://apps.apple.com/us/app/melon-africa/id6743396466">
    <View maxInlineSize={140}>
      <Image
        source="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
        accessibilityDescription="Download on the App Store"
      />
    </View>
  </Link>

  <Link to="https://play.google.com/store/apps/details?id=com.melonafrica.melon&pli=1">
    <View maxInlineSize={140}>
      <Image
        source="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
        accessibilityDescription="Get it on Google Play"
      />
    </View>
  </Link>
</InlineStack>
      </BlockStack>
    );
  };
