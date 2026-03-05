-- ============================================================
-- Gestão ONG - Supabase Schema
-- Migrated from PocketBase (18 collections)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  role text not null default 'Membro' check (role in ('SuperAdmin', 'Admin', 'Coordenador de Curso', 'Gestor', 'Membro')),
  organ_id uuid,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by authenticated users" on public.profiles
  for select using (auth.uid() is not null);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role, organ_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'Membro'),
    nullif(new.raw_user_meta_data->>'organ_id', '')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. ORGANS (organizations - hierarchical)
-- ============================================================
create table public.organs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  parent_id uuid references public.organs(id) on delete set null,
  subscription_plan text not null default 'Free' check (subscription_plan in ('Free', 'Pro', 'Enterprise')),
  subscription_status text not null default 'active' check (subscription_status in ('active', 'past_due', 'canceled', 'trialing')),
  subscription_ends_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.organs enable row level security;

create policy "Users see only their own organ" on public.organs
  for select using (
    id = (select organ_id from public.profiles where id = auth.uid())
    or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'SuperAdmin')
  );

create policy "Organs creatable by superadmins only" on public.organs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'SuperAdmin')
  );

create policy "Organs updatable by superadmins or local gestores" on public.organs
  for update using (
    (id = (select organ_id from public.profiles where id = auth.uid()) and exists (select 1 from public.profiles where id = auth.uid() and role = 'Gestor'))
    or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'SuperAdmin')
  );

create policy "Organs deletable by superadmins" on public.organs
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'SuperAdmin')
  );

-- ============================================================
-- 3. WORK PLANS (Isolated)
-- ============================================================
create table public.work_plans (
  id uuid default uuid_generate_v4() primary key,
  organ_id uuid references public.organs(id) on delete cascade not null,
  name text not null,
  year integer not null,
  status text not null default 'Draft' check (status in ('Draft', 'Submitted', 'Approved', 'Rejected')),
  objectives text,
  goals jsonb default '[]'::jsonb,
  budget jsonb default '{}'::jsonb,
  timeline_start timestamptz,
  timeline_end timestamptz,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.work_plans enable row level security;

create policy "Work plans isolated by organ" on public.work_plans
  for select using (
    organ_id = (select organ_id from public.profiles where id = auth.uid())
    or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'SuperAdmin')
  );

create policy "Work plans creatable by member of same organ" on public.work_plans
  for insert with check (
    organ_id = (select organ_id from public.profiles where id = auth.uid())
  );

create policy "Work plans updatable by organ members" on public.work_plans
  for update using (
    organ_id = (select organ_id from public.profiles where id = auth.uid())
    or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'SuperAdmin')
  );

-- ============================================================
-- 4. WORK PLAN FILES
-- ============================================================
create table public.work_plan_files (
  id uuid default uuid_generate_v4() primary key,
  work_plan_id uuid references public.work_plans(id) on delete cascade not null,
  file_url text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.work_plan_files enable row level security;

create policy "Work plan files viewable by authenticated" on public.work_plan_files
  for select using (auth.uid() is not null);

create policy "Work plan files creatable by authenticated" on public.work_plan_files
  for insert with check (auth.uid() is not null);

create policy "Work plan files deletable by authenticated" on public.work_plan_files
  for delete using (auth.uid() is not null);

-- ============================================================
-- 5. DOCUMENTS
-- ============================================================
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  organ_id uuid references public.organs(id) on delete cascade,
  title text not null,
  file_url text,
  type text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Documents viewable by authenticated" on public.documents
  for select using (auth.uid() is not null);

create policy "Documents creatable by authenticated" on public.documents
  for insert with check (auth.uid() is not null);

create policy "Documents updatable by authenticated" on public.documents
  for update using (auth.uid() is not null);

create policy "Documents deletable by authenticated" on public.documents
  for delete using (auth.uid() is not null);

-- ============================================================
-- 6. AUDIT LOGS
-- ============================================================
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  action_type text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  timestamp timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "Audit logs viewable by authenticated" on public.audit_logs
  for select using (auth.uid() is not null);

create policy "Audit logs creatable by authenticated" on public.audit_logs
  for insert with check (auth.uid() is not null);

-- ============================================================
-- 7. ACCOUNTABILITY REPORTS
-- ============================================================
create table public.accountability_reports (
  id uuid default uuid_generate_v4() primary key,
  organ_id uuid references public.organs(id) on delete cascade not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'Draft' check (status in ('Draft', 'In Review', 'Approved', 'Rejected')),
  responsible_user_id uuid references public.profiles(id) not null,
  created_by uuid references public.profiles(id) not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.accountability_reports enable row level security;

create policy "Reports viewable by authenticated" on public.accountability_reports
  for select using (auth.uid() is not null);

create policy "Reports creatable by authenticated" on public.accountability_reports
  for insert with check (auth.uid() is not null);

create policy "Reports updatable by authenticated" on public.accountability_reports
  for update using (auth.uid() is not null);

create policy "Reports deletable by authenticated" on public.accountability_reports
  for delete using (auth.uid() is not null);

-- ============================================================
-- 8. REPORT PHOTOS
-- ============================================================
create table public.report_photos (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.accountability_reports(id) on delete cascade not null,
  photo_url text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.report_photos enable row level security;

create policy "Report photos viewable by authenticated" on public.report_photos
  for select using (auth.uid() is not null);

create policy "Report photos creatable by authenticated" on public.report_photos
  for insert with check (auth.uid() is not null);

create policy "Report photos deletable by authenticated" on public.report_photos
  for delete using (auth.uid() is not null);

-- ============================================================
-- 9. BANK STATEMENTS
-- ============================================================
create table public.bank_statements (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.accountability_reports(id) on delete cascade not null,
  file_url text,
  bank_name text,
  period text,
  created_at timestamptz default now()
);

alter table public.bank_statements enable row level security;

create policy "Bank statements viewable by authenticated" on public.bank_statements
  for select using (auth.uid() is not null);

create policy "Bank statements creatable by authenticated" on public.bank_statements
  for insert with check (auth.uid() is not null);

create policy "Bank statements deletable by authenticated" on public.bank_statements
  for delete using (auth.uid() is not null);

-- ============================================================
-- 10. BANK TRANSACTIONS
-- ============================================================
create table public.bank_transactions (
  id uuid default uuid_generate_v4() primary key,
  statement_id uuid references public.bank_statements(id) on delete cascade not null,
  date timestamptz,
  description text,
  amount numeric(12,2),
  type text check (type in ('credit', 'debit')),
  created_at timestamptz default now()
);

alter table public.bank_transactions enable row level security;

create policy "Bank transactions viewable by authenticated" on public.bank_transactions
  for select using (auth.uid() is not null);

create policy "Bank transactions creatable by authenticated" on public.bank_transactions
  for insert with check (auth.uid() is not null);

create policy "Bank transactions deletable by authenticated" on public.bank_transactions
  for delete using (auth.uid() is not null);

-- ============================================================
-- 11. EXECUTION REPORTS
-- ============================================================
create table public.execution_reports (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.accountability_reports(id) on delete cascade not null,
  content text,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.execution_reports enable row level security;

create policy "Execution reports viewable by authenticated" on public.execution_reports
  for select using (auth.uid() is not null);

create policy "Execution reports creatable by authenticated" on public.execution_reports
  for insert with check (auth.uid() is not null);

create policy "Execution reports updatable by authenticated" on public.execution_reports
  for update using (auth.uid() is not null);

-- ============================================================
-- 12. PAYMENT RECORDS
-- ============================================================
create table public.payment_records (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.accountability_reports(id) on delete cascade not null,
  description text not null,
  amount numeric(12,2) not null,
  date timestamptz,
  receipt_url text,
  category text,
  created_at timestamptz default now()
);

alter table public.payment_records enable row level security;

create policy "Payment records viewable by authenticated" on public.payment_records
  for select using (auth.uid() is not null);

create policy "Payment records creatable by authenticated" on public.payment_records
  for insert with check (auth.uid() is not null);

create policy "Payment records deletable by authenticated" on public.payment_records
  for delete using (auth.uid() is not null);

-- ============================================================
-- 13. REPORT ATTACHMENTS
-- ============================================================
create table public.report_attachments (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.accountability_reports(id) on delete cascade not null,
  file_url text not null,
  file_name text not null,
  type text,
  created_at timestamptz default now()
);

alter table public.report_attachments enable row level security;

create policy "Report attachments viewable by authenticated" on public.report_attachments
  for select using (auth.uid() is not null);

create policy "Report attachments creatable by authenticated" on public.report_attachments
  for insert with check (auth.uid() is not null);

create policy "Report attachments deletable by authenticated" on public.report_attachments
  for delete using (auth.uid() is not null);

-- ============================================================
-- 14. REPORT AUDIT LOGS
-- ============================================================
create table public.report_audit_logs (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.accountability_reports(id) on delete cascade not null,
  user_id uuid references public.profiles(id),
  action text not null,
  details jsonb,
  timestamp timestamptz default now()
);

alter table public.report_audit_logs enable row level security;

create policy "Report audit logs viewable by authenticated" on public.report_audit_logs
  for select using (auth.uid() is not null);

create policy "Report audit logs creatable by authenticated" on public.report_audit_logs
  for insert with check (auth.uid() is not null);

-- ============================================================
-- 15. COURSES
-- ============================================================
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  organ_id uuid references public.organs(id) not null,
  name text not null,
  description text,
  duration integer not null default 1,
  category text,
  instructor_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.courses enable row level security;

create policy "Courses isolated by organ" on public.courses
  for select using (
    organ_id = (select organ_id from public.profiles where id = auth.uid())
    or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin')
  );

create policy "Courses creatable by organ members" on public.courses
  for insert with check (
    organ_id = (select organ_id from public.profiles where id = auth.uid())
  );

create policy "Courses updatable by creator or admin" on public.courses
  for update using (
    (created_by = auth.uid() and organ_id = (select organ_id from public.profiles where id = auth.uid())) 
    or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin')
  );

create policy "Courses deletable by admin" on public.courses
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin')
  );

-- ============================================================
-- 16. COURSE MODULES
-- ============================================================
create table public.course_modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  order_index integer not null default 0,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.course_modules enable row level security;

create policy "Course modules viewable by authenticated" on public.course_modules
  for select using (auth.uid() is not null);

create policy "Course modules creatable by authenticated" on public.course_modules
  for insert with check (auth.uid() is not null);

create policy "Course modules updatable by authenticated" on public.course_modules
  for update using (auth.uid() is not null);

create policy "Course modules deletable by authenticated" on public.course_modules
  for delete using (auth.uid() is not null);

-- ============================================================
-- 17. COURSE LESSONS
-- ============================================================
create table public.course_lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.course_modules(id) on delete cascade not null,
  title text not null,
  content text,
  order_index integer not null default 0,
  type text default 'text',
  duration integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.course_lessons enable row level security;

create policy "Course lessons viewable by authenticated" on public.course_lessons
  for select using (auth.uid() is not null);

create policy "Course lessons creatable by authenticated" on public.course_lessons
  for insert with check (auth.uid() is not null);

create policy "Course lessons updatable by authenticated" on public.course_lessons
  for update using (auth.uid() is not null);

create policy "Course lessons deletable by authenticated" on public.course_lessons
  for delete using (auth.uid() is not null);

-- ============================================================
-- 18. COURSE ENROLLMENTS
-- ============================================================
create table public.course_enrollments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'enrolled' check (status in ('enrolled', 'in_progress', 'completed', 'dropped')),
  progress integer default 0,
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  unique(course_id, user_id)
);

alter table public.course_enrollments enable row level security;

create policy "Enrollments viewable by authenticated" on public.course_enrollments
  for select using (auth.uid() is not null);

create policy "Enrollments creatable by authenticated" on public.course_enrollments
  for insert with check (auth.uid() is not null);

create policy "Enrollments updatable by owner" on public.course_enrollments
  for update using (user_id = auth.uid());

-- ============================================================
-- 19. CERTIFICATES
-- ============================================================
create table public.certificates (
  id uuid default uuid_generate_v4() primary key,
  enrollment_id uuid references public.course_enrollments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  issued_at timestamptz default now(),
  certificate_code text unique not null
);

alter table public.certificates enable row level security;

create policy "Certificates viewable by all" on public.certificates
  for select using (true);

create policy "Certificates creatable by authenticated" on public.certificates
  for insert with check (auth.uid() is not null);

-- ============================================================
-- 20. CERTIFICATE VALIDATIONS
-- ============================================================
create table public.certificate_validations (
  id uuid default uuid_generate_v4() primary key,
  certificate_id uuid references public.certificates(id) on delete cascade not null,
  validated_by text,
  validated_at timestamptz default now()
);

alter table public.certificate_validations enable row level security;

create policy "Certificate validations viewable by all" on public.certificate_validations
  for select using (true);

create policy "Certificate validations creatable by anyone" on public.certificate_validations
  for insert with check (true);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these in Supabase Dashboard > Storage or via API:
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger set_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.organs for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.work_plans for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.documents for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.accountability_reports for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.execution_reports for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.courses for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.course_modules for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.course_lessons for each row execute function public.update_updated_at();
