
export const validatePhoneNumber = (number: string): boolean => {
  // Check if the number is exactly 10 digits with no spaces or special characters
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(number);
};

export const formatPhoneNumber = (number: string): string => {
  if (!number || number.length !== 10) return number;
  
  // Format as XXX-XXX-XXXX
  return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};
