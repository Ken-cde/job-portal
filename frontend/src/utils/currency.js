const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

export const getCurrencySymbol = (currencyCode) => {
  return currencySymbols[currencyCode] || currencyCode || '$';
};

export const COMMON_CURRENCIES = Object.keys(currencySymbols);
