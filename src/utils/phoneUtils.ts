
export const validatePhoneNumber = (number: string): boolean => {
  // Check if the number is exactly 10 digits with no spaces or special characters
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(number);
};

export const formatPhoneNumber = (number: string): string => {
  // Return the raw number with no formatting
  return number.replace(/\D/g, '');
};

// Add an alias for backward compatibility
export const isValidPhoneNumber = validatePhoneNumber;
