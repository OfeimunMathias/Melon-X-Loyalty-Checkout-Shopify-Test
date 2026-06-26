import {
    BlockStack,
    View,
    Text,
    TextField,
    Button,
    Checkbox,
    Link,
    Banner,
    InlineStack,
    Select
  } from '@shopify/ui-extensions-react/checkout';
import { Notice } from '../services/auth/types';
import {useState} from 'react';

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
    notice:Notice;
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
    notice
  }: CreateCustomerStepProps) {

    const [dobYear, setDobYear] = useState(dateOfBirth?.split('-')[0] || '');
    const [dobMonth, setDobMonth] = useState(dateOfBirth?.split('-')[1] || '');
    const [dobDay, setDobDay] = useState(dateOfBirth?.split('-')[2] || '');
    const today = new Date();
    const maxYear = today.getFullYear() - 13;
    const minYear = today.getFullYear() - 120;


    const years = Array.from({length: maxYear - minYear + 1}, (_, index) => {
      const year = String(maxYear - index);
      return {label: year, value: year};
    });

    const months = [
      {label: 'January', value: '01'},
      {label: 'February', value: '02'},
      {label: 'March', value: '03'},
      {label: 'April', value: '04'},
      {label: 'May', value: '05'},
      {label: 'June', value: '06'},
      {label: 'July', value: '07'},
      {label: 'August', value: '08'},
      {label: 'September', value: '09'},
      {label: 'October', value: '10'},
      {label: 'November', value: '11'},
      {label: 'December', value: '12'},
    ];

    const getDaysInMonth = (year: string, month: string) => {
      if (!year || !month) return 31;
      return new Date(Number(year), Number(month), 0).getDate();
    };

    const days = Array.from(
      {length: getDaysInMonth(dobYear, dobMonth)},
      (_, index) => {
        const day = String(index + 1).padStart(2, '0');
        return {label: day, value: day};
      }
    );

    const updateDob = (part: 'year' | 'month' | 'day', value: string) => {
      const nextYear = part === 'year' ? value : dobYear;
      const nextMonth = part === 'month' ? value : dobMonth;
      let nextDay = part === 'day' ? value : dobDay;

      if (part === 'year') setDobYear(value);
      if (part === 'month') setDobMonth(value);
      if (part === 'day') setDobDay(value);

      if (nextYear && nextMonth) {
        const maxDay = getDaysInMonth(nextYear, nextMonth);

        if (nextDay && Number(nextDay) > maxDay) {
          nextDay = String(maxDay).padStart(2, '0');
          setDobDay(nextDay);
        }
      }

      if (nextYear && nextMonth && nextDay) {
        onDateOfBirthChange(`${nextYear}-${nextMonth}-${nextDay}`);
      }
    };

    return (
      <View border="base" borderRadius="large" padding="base">
        <BlockStack spacing="base">
          <Button kind="plain" onPress={onBack}>
            ← Back
          </Button>

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

          {/* <TextField
            label="Date of birth (YYYY-MM-DD)"
            value={dateOfBirth}
            onChange={onDateOfBirthChange}
          /> */}

       <BlockStack spacing="extraTight">
  <Text>Date of birth</Text>

            <InlineStack spacing="base">
            <Select
              label=""
              value={dobMonth}
              placeholder="MM"
              options={months.map((month) => ({
                label: month.value,
                value: month.value,
              }))}
              onChange={(value) => updateDob('month', value)}
            />

            <Select
              label=""
              value={dobDay}
              placeholder="DD"
              options={days}
              onChange={(value) => updateDob('day', value)}
            />

            <Select
              label=""
              value={dobYear}
              placeholder="YYYY"
              options={years}
              onChange={(value) => updateDob('year', value)}
            />
            </InlineStack>
</BlockStack>

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
