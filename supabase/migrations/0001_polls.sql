-- Schema for PollMaster: polls, poll_options, votes
-- Uses Supabase auth.users for user identities

-- 1) polls table
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  description text,
  allow_multiple_votes boolean not null default false,
  show_results boolean not null default true,
  expires_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_polls_updated_at on public.polls;
create trigger trg_polls_updated_at
before update on public.polls
for each row execute function public.set_updated_at();

-- 2) poll_options table
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 200),
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (poll_id, text)
);

create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);

-- 3) votes table
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- sanity: option must belong to the poll
  constraint option_belongs_to_poll check (
    exists (
      select 1 from public.poll_options po
      where po.id = option_id and po.poll_id = poll_id
    )
  )
);

create index if not exists idx_votes_poll on public.votes(poll_id);
create index if not exists idx_votes_voter on public.votes(voter_id);
create index if not exists idx_votes_option on public.votes(option_id);

-- Trigger to enforce single-vote constraint when allow_multiple_votes = false
create or replace function public.enforce_single_vote()
returns trigger as $$
declare
  allow_multi boolean;
  existing_count int;
begin
  select allow_multiple_votes into allow_multi from public.polls where id = new.poll_id;
  if allow_multi is null then
    raise exception 'Poll not found';
  end if;

  if allow_multi = false then
    select count(*) into existing_count
    from public.votes v
    where v.poll_id = new.poll_id
      and v.voter_id = new.voter_id;

    if existing_count > 0 then
      raise exception 'You have already voted on this poll.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_votes_single_vote on public.votes;
create trigger trg_votes_single_vote
before insert on public.votes
for each row execute function public.enforce_single_vote();

-- Optional helper view for results
create or replace view public.poll_results as
select 
  p.id as poll_id,
  p.title,
  p.allow_multiple_votes,
  p.show_results,
  p.expires_at,
  p.created_by,
  po.id as option_id,
  po.text as option_text,
  count(v.id) as votes
from public.polls p
join public.poll_options po on po.poll_id = p.id
left join public.votes v on v.option_id = po.id
group by p.id, po.id;

-- Row Level Security
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;

-- Policies for polls
-- Anyone can read polls
create policy if not exists polls_select for select on public.polls
  using (true);
-- Only owner can insert
create policy if not exists polls_insert for insert on public.polls
  with check (auth.uid() = created_by);
-- Only owner can update/delete
create policy if not exists polls_owner_modify for update on public.polls
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);
create policy if not exists polls_owner_delete for delete on public.polls
  using (auth.uid() = created_by);

-- Policies for poll_options
-- Anyone can read options (for public polls)
create policy if not exists poll_options_select for select on public.poll_options
  using (true);
-- Only poll owner can add options
create policy if not exists poll_options_insert for insert on public.poll_options
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.created_by = auth.uid()
    )
  );
-- Only poll owner can update/delete options
create policy if not exists poll_options_modify for update on public.poll_options
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.created_by = auth.uid()
    )
  );
create policy if not exists poll_options_delete for delete on public.poll_options
  using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and p.created_by = auth.uid()
    )
  );

-- Policies for votes
-- Anyone (including anon) can read votes aggregate via view; row read allowed
create policy if not exists votes_select for select on public.votes
  using (true);
-- Only authenticated users can vote
create policy if not exists votes_insert for insert on public.votes
  with check (
    auth.role() = 'authenticated' and auth.uid() = voter_id and
    exists (
      select 1 from public.polls p
      where p.id = poll_id and (p.is_active = true) and (p.expires_at is null or now() < p.expires_at)
    )
  );
-- Allow a voter to delete their own vote (optional)
create policy if not exists votes_delete_own for delete on public.votes
  using (auth.uid() = voter_id);

-- Helpful constraints: ensure at least 2 options per poll before activation
create or replace function public.enforce_min_options()
returns trigger as $$
declare
  option_count int;
begin
  if new.is_active = true then
    select count(*) into option_count from public.poll_options where poll_id = new.id;
    if option_count < 2 then
      raise exception 'A poll must have at least 2 options before activation.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_polls_min_options on public.polls;
create trigger trg_polls_min_options
before update of is_active on public.polls
for each row execute function public.enforce_min_options();