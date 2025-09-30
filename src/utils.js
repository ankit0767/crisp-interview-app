// This file will hold helper functions, like validators.

// A simple email validation using a regular expression
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// A simple phone validation: must be 10 digits, can contain spaces or dashes
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\d[\s-]?){9}\d$/;
  return phoneRegex.test(phone);
};