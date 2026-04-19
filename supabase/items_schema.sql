-- NeighbourLink items schema
-- Run this in Supabase SQL Editor for project: dtndxklniwvrxpiqbyym

create extension if not exists pgcrypto;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'other',
  status text not null default 'available',
  is_on_loan boolean not null default false,
  due_date timestamptz,
  price_per_day numeric(10,2) not null default 0,
  image_url text,
  distance text default 'Nearby',
  rating numeric(3,2) default 4.8,
  thread_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade existing table to match app fields.
alter table public.items
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists title text,
  add column if not exists category text,
  add column if not exists status text,
  add column if not exists is_on_loan boolean,
  add column if not exists due_date timestamptz,
  add column if not exists price_per_day numeric(10,2),
  add column if not exists image_url text,
  add column if not exists distance text,
  add column if not exists rating numeric(3,2),
  add column if not exists thread_id text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

-- Backfill safe defaults before NOT NULL enforcement.
update public.items
set title = coalesce(nullif(trim(title), ''), 'Untitled item')
where title is null or trim(title) = '';

update public.items
set category = coalesce(nullif(trim(category), ''), 'other')
where category is null or trim(category) = '';

update public.items
set status = case
  when lower(coalesce(status, '')) in ('on loan', 'on_loan', 'on-loan') then 'on_loan'
  when lower(coalesce(status, '')) = 'available' then 'available'
  else 'available'
end;

update public.items
set is_on_loan = coalesce(is_on_loan, status = 'on_loan')
where is_on_loan is null;

update public.items
set price_per_day = coalesce(price_per_day, 0)
where price_per_day is null;

update public.items
set created_at = coalesce(created_at, now())
where created_at is null;

update public.items
set updated_at = coalesce(updated_at, now())
where updated_at is null;

-- Align column defaults and required constraints.
alter table public.items
  alter column title set not null,
  alter column category set not null,
  alter column status set not null,
  alter column is_on_loan set not null,
  alter column price_per_day set not null,
  alter column created_at set not null,
  alter column updated_at set not null,
  alter column category set default 'other',
  alter column status set default 'available',
  alter column is_on_loan set default false,
  alter column price_per_day set default 0,
  alter column distance set default 'Nearby',
  alter column rating set default 4.8,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.items
  drop constraint if exists items_status_check;
alter table public.items
  add constraint items_status_check
  check (status in ('available', 'on_loan'));

alter table public.items
  drop constraint if exists items_price_non_negative;
alter table public.items
  add constraint items_price_non_negative
  check (price_per_day >= 0);

create index if not exists items_user_id_idx on public.items(user_id);
create index if not exists items_created_at_idx on public.items(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

alter table public.items enable row level security;

-- Anyone can read listings.
drop policy if exists "items_select_public" on public.items;
create policy "items_select_public"
on public.items
for select
to anon, authenticated
using (true);

-- Signed-in users can create their own items.
drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own"
on public.items
for insert
to authenticated
with check (auth.uid() = user_id);

-- Signed-in users can update only their own items.
drop policy if exists "items_update_own" on public.items;
create policy "items_update_own"
on public.items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Signed-in users can delete only their own items.
drop policy if exists "items_delete_own" on public.items;
create policy "items_delete_own"
on public.items
for delete
to authenticated
using (auth.uid() = user_id);

-- ============================================================
-- Additional tables from ERD
-- ============================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null,
  phone text,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.borrow_requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  borrower_user_id uuid not null references auth.users(id) on delete cascade,
  requested_start_date date not null,
  requested_end_date date not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.borrow_transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.borrow_requests(id) on delete cascade,
  lender_user_id uuid not null references auth.users(id) on delete cascade,
  borrower_user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  due_date date not null,
  returned_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.borrow_transactions(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  receiver_user_id uuid not null references auth.users(id) on delete cascade,
  message_text text not null,
  sent_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists thread_id text,
  add column if not exists contact_name text,
  add column if not exists item_title text;

alter table public.messages
  alter column transaction_id drop not null,
  alter column receiver_user_id drop not null;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.borrow_transactions(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  reviewee_user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  status text not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists item_images_item_id_idx on public.item_images(item_id);
create index if not exists borrow_requests_item_id_idx on public.borrow_requests(item_id);
create index if not exists borrow_requests_borrower_user_id_idx on public.borrow_requests(borrower_user_id);
create index if not exists borrow_transactions_request_id_idx on public.borrow_transactions(request_id);
create index if not exists borrow_transactions_lender_user_id_idx on public.borrow_transactions(lender_user_id);
create index if not exists borrow_transactions_borrower_user_id_idx on public.borrow_transactions(borrower_user_id);
create index if not exists messages_transaction_id_idx on public.messages(transaction_id);
create index if not exists messages_thread_id_idx on public.messages(thread_id);
create index if not exists messages_sender_user_id_idx on public.messages(sender_user_id);
create index if not exists messages_receiver_user_id_idx on public.messages(receiver_user_id);
create index if not exists reviews_transaction_id_idx on public.reviews(transaction_id);
create index if not exists reviews_reviewer_user_id_idx on public.reviews(reviewer_user_id);
create index if not exists reviews_reviewee_user_id_idx on public.reviews(reviewee_user_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists user_verifications_user_id_idx on public.user_verifications(user_id);
create index if not exists reports_item_id_idx on public.reports(item_id);
create index if not exists reports_reporter_user_id_idx on public.reports(reporter_user_id);
create index if not exists reports_reported_user_id_idx on public.reports(reported_user_id);

alter table public.users enable row level security;
alter table public.item_images enable row level security;
alter table public.borrow_requests enable row level security;
alter table public.borrow_transactions enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.user_verifications enable row level security;
alter table public.reports enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_select_community" on public.users;
create policy "users_select_community"
on public.users for select
to authenticated
using (true);

drop policy if exists "users_upsert_own" on public.users;
create policy "users_upsert_own"
on public.users for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "item_images_select_public" on public.item_images;
create policy "item_images_select_public"
on public.item_images for select
to anon, authenticated
using (true);

drop policy if exists "item_images_manage_owner" on public.item_images;
create policy "item_images_manage_owner"
on public.item_images for all
to authenticated
using (
  exists (
    select 1
    from public.items i
    where i.id = item_images.item_id and i.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.items i
    where i.id = item_images.item_id and i.user_id = auth.uid()
  )
);

drop policy if exists "borrow_requests_participants" on public.borrow_requests;
create policy "borrow_requests_participants"
on public.borrow_requests for select
to authenticated
using (
  borrower_user_id = auth.uid()
  or exists (
    select 1 from public.items i where i.id = borrow_requests.item_id and i.user_id = auth.uid()
  )
);

drop policy if exists "borrow_requests_insert_borrower" on public.borrow_requests;
create policy "borrow_requests_insert_borrower"
on public.borrow_requests for insert
to authenticated
with check (borrower_user_id = auth.uid());

drop policy if exists "borrow_requests_update_participants" on public.borrow_requests;
create policy "borrow_requests_update_participants"
on public.borrow_requests for update
to authenticated
using (
  borrower_user_id = auth.uid()
  or exists (
    select 1 from public.items i where i.id = borrow_requests.item_id and i.user_id = auth.uid()
  )
)
with check (
  borrower_user_id = auth.uid()
  or exists (
    select 1 from public.items i where i.id = borrow_requests.item_id and i.user_id = auth.uid()
  )
);

drop policy if exists "borrow_transactions_participants" on public.borrow_transactions;
create policy "borrow_transactions_participants"
on public.borrow_transactions for select
to authenticated
using (lender_user_id = auth.uid() or borrower_user_id = auth.uid());

drop policy if exists "borrow_transactions_manage_participants" on public.borrow_transactions;
create policy "borrow_transactions_manage_participants"
on public.borrow_transactions for all
to authenticated
using (lender_user_id = auth.uid() or borrower_user_id = auth.uid())
with check (lender_user_id = auth.uid() or borrower_user_id = auth.uid());

drop policy if exists "messages_participants" on public.messages;
create policy "messages_participants"
on public.messages for select
to authenticated
using (sender_user_id = auth.uid() or receiver_user_id = auth.uid());

drop policy if exists "messages_send_own" on public.messages;
create policy "messages_send_own"
on public.messages for insert
to authenticated
with check (sender_user_id = auth.uid());

drop policy if exists "reviews_participants" on public.reviews;
create policy "reviews_participants"
on public.reviews for select
to authenticated
using (reviewer_user_id = auth.uid() or reviewee_user_id = auth.uid());

drop policy if exists "reviews_insert_reviewer" on public.reviews;
create policy "reviews_insert_reviewer"
on public.reviews for insert
to authenticated
with check (reviewer_user_id = auth.uid());

drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "user_verifications_own" on public.user_verifications;
create policy "user_verifications_own"
on public.user_verifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_verifications_insert_own" on public.user_verifications;
create policy "user_verifications_insert_own"
on public.user_verifications for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "reports_involved_users" on public.reports;
create policy "reports_involved_users"
on public.reports for select
to authenticated
using (reporter_user_id = auth.uid() or reported_user_id = auth.uid());

drop policy if exists "reports_insert_reporter" on public.reports;
create policy "reports_insert_reporter"
on public.reports for insert
to authenticated
with check (reporter_user_id = auth.uid());
