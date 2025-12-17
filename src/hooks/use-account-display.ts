import { useMemo } from 'react';
import { accountNumberToDisplay, formatAccountDisplay } from '@/lib/account-utils';

export function useAccountDisplay(accountNumber: string | undefined | null) {
  return useMemo(() => {
    if (!accountNumber) return { display: '', formatted: '' };
    return {
      display: accountNumberToDisplay(accountNumber),
      formatted: formatAccountDisplay(accountNumber),
    };
  }, [accountNumber]);
}
