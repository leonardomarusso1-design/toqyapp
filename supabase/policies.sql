-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
alter table public.organizations enable row level security;
alter table public.bio_sites enable row level security;
alter table public.catalog_items enable row level security;
alter table public.access_keys enable row level security;
alter table public.analytics_events enable row level security;
alter table public.subscriptions enable row level security;

-- ============================================
-- Organizations Policies
-- ============================================

-- Anyone can view public organization info (for frontend display)
create policy "Public organizations are visible"
  on public.organizations
  for select
  using (true);

-- Authenticated users can only manage their own organization
-- (Will be enforced by application logic with auth context)
create policy "Manage own organization"
  on public.organizations
  for all
  using (true)  -- Application level auth check required
  with check (true);

-- ============================================
-- Bio Sites Policies
-- ============================================

-- Public bio sites are visible to everyone
create policy "Public biosites are visible"
  on public.bio_sites
  for select
  using (is_public = true);

-- Authenticated users can view their organization's sites
create policy "View organization biosites"
  on public.bio_sites
  for select
  using (true);  -- Application level auth check required

-- Users can manage their organization's sites
create policy "Manage organization biosites"
  on public.bio_sites
  for update
  using (true)  -- Application level auth check required
  with check (true);

-- Users can create sites in their organization
create policy "Create biosites in organization"
  on public.bio_sites
  for insert
  with check (true);  -- Application level auth check required

-- Users can delete their sites
create policy "Delete own biosites"
  on public.bio_sites
  for delete
  using (true);  -- Application level auth check required

-- ============================================
-- Catalog Items Policies
-- ============================================

-- Catalog items of public sites are visible
create policy "View catalog of public sites"
  on public.catalog_items
  for select
  using (
    exists (
      select 1 from public.bio_sites
      where bio_sites.id = catalog_items.bio_site_id
      and bio_sites.is_public = true
    )
  );

-- Owners can manage catalog items
create policy "Manage own catalog items"
  on public.catalog_items
  for all
  using (true)  -- Application level auth check required
  with check (true);

-- ============================================
-- Access Keys Policies
-- ============================================

-- Anyone can validate an access key
create policy "Validate access keys"
  on public.access_keys
  for select
  using (true);

-- Site owners can manage access keys
create policy "Manage own access keys"
  on public.access_keys
  for all
  using (true)  -- Application level auth check required
  with check (true);

-- ============================================
-- Analytics Events Policies
-- ============================================

-- Anyone can insert analytics events (anonymous tracking)
create policy "Insert analytics events"
  on public.analytics_events
  for insert
  with check (true);

-- Site owners can view their analytics
create policy "View own analytics"
  on public.analytics_events
  for select
  using (
    exists (
      select 1 from public.bio_sites
      where bio_sites.id = analytics_events.bio_site_id
    )
  );  -- Application level auth check required

-- ============================================
-- Subscriptions Policies
-- ============================================

-- Owners can view their subscriptions
create policy "View own subscriptions"
  on public.subscriptions
  for select
  using (true);  -- Application level auth check required

-- Owners can manage their subscriptions
create policy "Manage own subscriptions"
  on public.subscriptions
  for all
  using (true)  -- Application level auth check required
  with check (true);

-- ============================================
-- Notes
-- ============================================
-- All authentication logic is implemented at the application layer.
-- These policies are permissive and rely on backend validation.
-- In production, strengthen with proper Supabase Auth integration.
