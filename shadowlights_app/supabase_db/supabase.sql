-- Create the "tasks" table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  is_complete boolean not null default false,
  description text
);

-- Enable Row Level Security (RLS)
alter table public.tasks enable row level security;

-- Create a policy to allow a user to see their own tasks
create policy "Users can view their own tasks." on public.tasks
  for select using (auth.uid() = user_id);

-- Create a policy to allow a user to create a task
create policy "Users can create tasks." on public.tasks
  for insert with check (auth.uid() = user_id);

-- Create a policy to allow a user to update their own tasks
create policy "Users can update their own tasks." on public.tasks
  for update using (auth.uid() = user_id);

-- Create a policy to allow a user to delete their own tasks
create policy "Users can delete their own tasks." on public.tasks
  for delete using (auth.uid() = user_id);

-- Set up real-time for the 'tasks' table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;