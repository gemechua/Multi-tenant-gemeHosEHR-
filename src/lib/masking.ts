export const maskMRN = (mrn: string) => {
  if (!mrn || mrn.length <= 4) return '****';
  return `***${mrn.slice(-4)}`;
};

export const maskCurrency = (amount: number) => {
  // Simple masking for financial data - could be more complex depending on requirements
  return '****';
};
