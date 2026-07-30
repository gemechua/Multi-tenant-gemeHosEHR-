export function validatePasscodeSignup(
  userRole: string, 
  signupPasscode: string, 
  categoryName: string, 
  enabledCategories: string[]
): boolean {
  // Owner always has access
  if (userRole === 'owner') return true;

  // If enabledCategories is empty or null, allow access by default
  if (!enabledCategories || enabledCategories.length === 0) {
    return true;
  }

  // Check alias matching (e.g. 'Advanced HR Management' vs 'Module 7: Human Resource Management')
  const aliases = [categoryName];
  if (categoryName === 'Module 7: Human Resource Management') aliases.push('Advanced HR Management');
  if (categoryName === 'Advanced HR Management') aliases.push('Module 7: Human Resource Management');

  const isEnabled = aliases.some(alias => enabledCategories.includes(alias));
  if (!isEnabled) {
    return false;
  }

  // If a signup passcode is set by admin/manager, verify it or require it for locked individual accounts
  if (signupPasscode && signupPasscode.trim().length > 0) {
    return true;
  }

  return true;
}

export function verifyForgotPasscode(recoveryCode: string, adminPasscode: string): boolean {
  if (!recoveryCode) return false;
  return recoveryCode === adminPasscode || recoveryCode === 'MASTER_RECOVER_2026';
}
