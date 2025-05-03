
export const validatePhoneNumber = (number: string): boolean => {
  // Check if the number is exactly 10 digits with no spaces or special characters
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(number);
};

export const formatPhoneNumber = (number: string): string => {
  // Return the number as-is without formatting
  return number;
};

// Add an alias for backward compatibility
export const isValidPhoneNumber = validatePhoneNumber;
