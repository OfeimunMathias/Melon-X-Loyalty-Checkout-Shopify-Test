
export function validatePhone(value: string) {
  let formatted = value.trim();

  // Normalize all formats to 234XXXXXXXXXX
  if (formatted.startsWith('+234')) {
    formatted = `234${formatted.slice(4)}`; // +2348035701934 → 2348035701934
  } else if (formatted.startsWith('0')) {
    formatted = `234${formatted.slice(1)}`; // 08035701934 → 2348035701934
  }
  // already starts with 234 → leave as is

  if (!formatted) {
    return {
      success: false,
      message: 'Phone number is required',
    };
  }

  if (!/^234\d{10}$/.test(formatted)) {
    return {
      success: false,
      message: 'Enter a valid Nigerian phone number',
    };
  }

  return {
    success: true,
    data: formatted, // always 2348035701934 format
  };
}

export function validateCreateCustomer(data: {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  acceptTerms: boolean;
}) {
  if (!data.firstName.trim()) {
    return {
      success: false,
      message: 'First name is required',
    };
  }

  if (!data.lastName.trim()) {
    return {
      success: false,
      message: 'Last name is required',
    };
  }

  if (!data.email.trim()) {
    return {
      success: false,
      message: 'Email is required',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(data.email)) {
    return {
      success: false,
      message: 'Enter a valid email',
    };
  }

  if (!data.dateOfBirth.trim()) {
    return {
      success: false,
      message: 'Date of birth is required',
    };
  }

  if (!data.acceptTerms) {
    return {
      success: false,
      message: 'You must accept the loyalty terms',
    };
  }

  return {
    success: true,
    data,
  };
}


