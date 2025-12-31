-- notification_preferences table
create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  login_alerts boolean not null default true,
  geo_fencing_alerts boolean not null default false,
  password_change_alerts boolean not null default true,
  debit_alerts boolean not null default true,
  credit_alerts boolean not null default true,
  large_transaction_alerts boolean not null default true,
  failed_transaction_alerts boolean not null default true,
  low_balance_alerts boolean not null default true,
  promotions_offers boolean not null default false,
  monthly_statements boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Trigger to update updated_at on notification_preferences
create or replace function update_notification_preferences_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_notification_preferences_updated_at on notification_preferences;
create trigger set_notification_preferences_updated_at
before update on notification_preferences
for each row execute procedure update_notification_preferences_updated_at();
