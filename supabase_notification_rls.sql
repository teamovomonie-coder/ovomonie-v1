-- Enable RLS
alter table notification_preferences enable row level security;
alter table notifications enable row level security;

-- Only allow users to select/update their own preferences
create policy "Users can view their own notification preferences" on notification_preferences
  for select using (auth.uid() = user_id);

create policy "Users can insert their own notification preferences" on notification_preferences
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own notification preferences" on notification_preferences
  for update using (auth.uid() = user_id);

-- Only allow users to select/insert/update their own notifications
create policy "Users can view their own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "Users can insert their own notifications" on notifications
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own notifications" on notifications
  for update using (auth.uid() = user_id);
