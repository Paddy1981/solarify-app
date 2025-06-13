
export interface Currency {
  value: string; // e.g., "USD"
  label: string; // e.g., "USD - US Dollar"
  symbol: string; // e.g., "$"
}

export const currencyOptions: Currency[] = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "INR", label: "INR - Indian Rupee", symbol: "₹" },
  { value: "CAD", label: "CAD - Canadian Dollar", symbol: "C$" },
  { value: "AUD", label: "AUD - Australian Dollar", symbol: "A$" },
];

export function getCurrencyByCode(code?: string): Currency | undefined {
  if (!code) return undefined;
  return currencyOptions.find(c => c.value.toUpperCase() === code.toUpperCase());
}

export function getDefaultCurrency(): Currency {
  return currencyOptions[0]; // Default to USD
}
