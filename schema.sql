-- Supabase Dashboard > SQL Editor এ এই ফাইলটি চালান
create table categories(id uuid primary key default gen_random_uuid(),name text unique not null);
create table videos(id uuid primary key default gen_random_uuid(),title text not null,description text,category_id uuid references categories(id) on delete set null,thumbnail_url text,video_url text,duration text,allow_download boolean default false,published boolean default false,views int default 0,created_at timestamptz default now());
create table admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table messages(id uuid primary key default gen_random_uuid(),name text,email text,subject text,body text,created_at timestamptz default now());
create function is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from admins where user_id=auth.uid())$$;
create function increment_views(vid uuid) returns void language sql security definer set search_path=public as $$update videos set views=views+1 where id=vid and published$$;
alter table categories enable row level security;alter table videos enable row level security;alter table admins enable row level security;alter table messages enable row level security;
create policy "cats read" on categories for select using(true);
create policy "cats admin" on categories for all using(is_admin()) with check(is_admin());
create policy "videos read" on videos for select using(published or is_admin());
create policy "videos admin" on videos for all using(is_admin()) with check(is_admin());
create policy "admins self" on admins for select using(user_id=auth.uid());
create policy "msg send" on messages for insert with check(true);
create policy "msg admin read" on messages for select using(is_admin());
insert into storage.buckets(id,name,public) values('thumbnails','thumbnails',true),('videos','videos',true) on conflict do nothing;
create policy "media read" on storage.objects for select using(bucket_id in('thumbnails','videos'));
create policy "media admin" on storage.objects for all using(bucket_id in('thumbnails','videos') and is_admin()) with check(bucket_id in('thumbnails','videos') and is_admin());
insert into categories(name) values('গোপাল ভাঁড়'),('নাট বল্টু'),('CID'),('কার্টুন'),('বাংলা বিনোদন'),('অন্যান্য');
-- অ্যাডমিন তৈরি: Authentication > Users এ ইউজার বানিয়ে তার UID দিয়ে নিচেরটি চালান
-- insert into admins(user_id) values('ইউজারের-UID');
