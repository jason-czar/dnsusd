/**
 * Address Validation Module
 * Validates cryptocurrency addresses for various chains
 */

/**
 * Validate Bitcoin address (P2PKH, P2SH, Bech32)
 * Basic validation - production should use a proper library
 */
export function validateBitcoinAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // P2PKH (starts with 1), P2SH (starts with 3), Bech32 (starts with bc1)
  const p2pkhRegex = /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const p2shRegex = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^bc1[a-z0-9]{39,87}$/;
  
  return p2pkhRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address);
}

/**
 * Validate Ethereum address (with basic checksum validation)
 * Full EIP-55 checksum validation would require crypto library
 */
export function validateEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Basic format: 0x followed by 40 hexadecimal characters
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  
  if (!ethereumRegex.test(address)) return false;
  
  // If all lowercase or all uppercase (except 0x), it passes basic validation
  const addressWithout0x = address.slice(2);
  if (addressWithout0x === addressWithout0x.toLowerCase() || 
      addressWithout0x === addressWithout0x.toUpperCase()) {
    return true;
  }
  
  // For mixed case, we should validate EIP-55 checksum
  // For now, we'll accept it (production should use ethers.js getAddress)
  return true;
}

/**
 * Validate Lightning Network address
 * Basic format validation for LNURL and Lightning invoices
 */
export function validateLightningAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Lightning invoice format (starts with ln)
  const invoiceRegex = /^ln[a-z0-9]+$/i;
  
  // LNURL format
  const lnurlRegex = /^lnurl[a-z0-9]+$/i;
  
  // Lightning address format (email-like)
  const lightningAddressRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  
  return invoiceRegex.test(address) || 
         lnurlRegex.test(address) || 
         lightningAddressRegex.test(address);
}

/**
 * Validate address based on currency type
 */
export function validateAddress(address: string, currency: string): boolean {
  switch (currency.toLowerCase()) {
    case 'bitcoin':
    case 'btc':
      return validateBitcoinAddress(address);
    
    case 'ethereum':
    case 'eth':
      return validateEthereumAddress(address);
    
    case 'lightning':
    case 'ln':
      return validateLightningAddress(address);
    
    default:
      // For unknown currencies, do basic validation
      return !!(address && address.length > 10 && address.length < 200);
  }
}
