
export const validatePhoneNumber = (number: string): boolean => {
  // Check if the number is exactly 10 digits with no spaces or special characters
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(number);
};

export const formatPhoneNumber = (number: string): string => {
  // Clean the number of any non-digit characters
  const cleanNumber = number.replace(/\D/g, '');
  
  // Return formatted number or clean number if it doesn't match the pattern
  if (validatePhoneNumber(cleanNumber)) {
    return cleanNumber;
  }
  
  // Return the raw cleaned number if it doesn't match the expected format
  return cleanNumber;
};

// Add an alias for backward compatibility
export const isValidPhoneNumber = validatePhoneNumber;
