import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type NotificationPreferences = {
  id: string;
  user_id: string;
  login_alerts: boolean;
  geo_fencing_alerts: boolean;
  password_change_alerts: boolean;
  debit_alerts: boolean;
  credit_alerts: boolean;
  large_transaction_alerts: boolean;
  failed_transaction_alerts: boolean;
  low_balance_alerts: boolean;
  promotions_offers: boolean;
  monthly_statements: boolean;
  created_at: string;
  updated_at: string;
};

const DEFAULTS: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  login_alerts: true,
  geo_fencing_alerts: false,
  password_change_alerts: true,
  debit_alerts: true,
  credit_alerts: true,
  large_transaction_alerts: true,
  failed_transaction_alerts: true,
  low_balance_alerts: true,
  promotions_offers: false,
  monthly_statements: true,
};

export function useNotificationPreferences(userId: string | null) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') { // not found
          setError(error.message);
        } else if (!data) {
          // No row: use defaults
          setPrefs({
            ...DEFAULTS,
            id: '',
            user_id: userId,
            created_at: '',
            updated_at: '',
          });
        } else {
          setPrefs(data);
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Update preference
  const updatePref = useCallback(
    async (key: keyof typeof DEFAULTS, value: boolean) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          [key]: value,
        }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) setError(error.message);
      if (data) setPrefs(data);
      setLoading(false);
    },
    [userId]
  );

  return { prefs, loading, error, updatePref };
}
