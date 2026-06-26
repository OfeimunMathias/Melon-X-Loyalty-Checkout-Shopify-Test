export function validatePhone(value: string) {
  let formatted = value.trim();

  if (formatted.startsWith('+234')) {
    formatted = `0${formatted.slice(4)}`;
  }

  if (!formatted) {
    return {
      success: false,
      message: 'Phone number is required',
    };
  }

  if (!/^\d{11}$/.test(formatted)) {
    return {
      success: false,
      message: 'Enter a valid Nigerian phone number',
    };
  }

  return {
    success: true,
    data: formatted,
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
