import {
    BlockStack,
    View,
    Text,
    TextField,
    Button,
    Checkbox,
    Link,
  } from '@shopify/ui-extensions-react/checkout';

  type CreateCustomerStepProps = {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    acceptTerms: boolean;
    isLoading: boolean;
    onFirstNameChange: (value: string) => void;
    onLastNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onDateOfBirthChange: (value: string) => void;
    onAcceptTermsChange: (value: boolean) => void;
    onCreateCustomer: () => void;
    onBack: () => void;
  };

  export function CreateCustomerStep({
    firstName,
    lastName,
    email,
    dateOfBirth,
    acceptTerms,
    isLoading,
    onFirstNameChange,
    onLastNameChange,
    onEmailChange,
    onDateOfBirthChange,
    onAcceptTermsChange,
    onCreateCustomer,
    onBack,
  }: CreateCustomerStepProps) {
    return (
      <View border="base" borderRadius="large" padding="base">
        <BlockStack spacing="base">
          <Button kind="plain" onPress={onBack}>
            ← Back
          </Button>

          <BlockStack spacing="extraTight">
            <Text emphasis="bold">Join Store Rewards</Text>
            <Text size="small" appearance="subdued">
              Join rewards to earn points on this purchase and future orders.
            </Text>
          </BlockStack>

          <TextField
            label="First name (e.g. Tunde)"
            value={firstName}
            onChange={onFirstNameChange}
          />

          <TextField
            label="Last name (e.g. Adebayo)"
            value={lastName}
            onChange={onLastNameChange}
          />

          <TextField
            label="Email (e.g. tunde@example.com)"
            value={email}
            onChange={onEmailChange}
          />

          <TextField
            label="Date of birth (YYYY-MM-DD)"
            value={dateOfBirth}
            onChange={onDateOfBirthChange}
          />

              <Checkbox checked={acceptTerms} onChange={onAcceptTermsChange}>
                I agree to the loyalty{' '}
                <Link to="https://partner-dev.getmelon.co/terms-of-use">
                  terms and conditions
                </Link>
                .
              </Checkbox>
          <Button kind="primary" onPress={onCreateCustomer} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </BlockStack>
      </View>
    );
  }
