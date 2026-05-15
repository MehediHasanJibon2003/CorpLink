-- ============================================================
-- CORPLINK — EMPLOYEE MODULE TABLES
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run: uses IF NOT EXISTS everywhere
-- ============================================================

-- NOTE: companies = corporates (your existing table uses both names)
-- We reference "companies" because ProtectedRoute.jsx queries it as "companies"
-- but the actual table might be named "corporates" — adjust FK refs if needed.

-- ============================================================
-- 1. EMPLOYEES TABLE
--    Stores employee profile data linked to auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID REFERENCES corporates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  designation   TEXT,
  department_id UUID,           -- FK to departments (if table exists)
  role          TEXT DEFAULT 'employee',
  profile_photo TEXT,           -- URL from Supabase Storage
  joined_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_employees_user_id     ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id  ON employees(company_id);

-- ============================================================
-- 2. TASKS TABLE
--    Already likely exists — adds missing columns if not
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID REFERENCES corporates(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  assigned_to    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id     UUID,           -- FK to projects
  department_id  UUID,           -- FK to departments
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','needs_review','finished','completed','rejected')),
  priority       TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  deadline       TIMESTAMP WITH TIME ZONE,
  progress_note  TEXT,           -- Employee's progress update note
  due_date       TIMESTAMP WITH TIME ZONE,  -- alias for deadline (used in old code)
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to  ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id   ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id   ON tasks(project_id);

-- ============================================================
-- 3. DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES corporates(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  head_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);

-- ============================================================
-- 4. TEAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES corporates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  lead_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);

-- ============================================================
-- 5. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES corporates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','planning','on_hold','completed','cancelled')),
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_id    ON projects(team_id);

-- ============================================================
-- 6. PROJECT MEMBERS TABLE
--    Which employees are in which projects
-- ============================================================
CREATE TABLE IF NOT EXISTS project_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_in_project  TEXT DEFAULT 'member' CHECK (role_in_project IN ('member','lead','contributor')),
  joined_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_employee_id ON project_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id  ON project_members(project_id);

-- ============================================================
-- 7. ANNOUNCEMENTS TABLE
--    Company-level announcements (Corporate Feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES corporates(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT DEFAULT 'announcement' CHECK (type IN ('announcement','event','promotion','general')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_company_id ON announcements(company_id);

-- ============================================================
-- 8. POST REACTIONS TABLE
--    Like/react to feed posts or announcements
-- ============================================================
CREATE TABLE IF NOT EXISTS post_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL,             -- references announcements.id
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID REFERENCES corporates(id) ON DELETE CASCADE,
  type        TEXT DEFAULT 'like',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, employee_id, type)
);

-- ============================================================
-- 9. POST COMMENTS TABLE
--    Comments on feed posts or announcements
-- ============================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL,             -- references announcements.id
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID REFERENCES corporates(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

-- ============================================================
-- 10. NOTIFICATIONS TABLE
--     Real-time alerts for employees
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES corporates(id) ON DELETE CASCADE,
  type       TEXT DEFAULT 'general' CHECK (type IN ('task_assigned','task_update','project_update','announcement','collaboration','approval','general')),
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON notifications(is_read);

-- ============================================================
-- 11. COLLABORATION REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id   UUID REFERENCES corporates(id) ON DELETE CASCADE,
  corporate_id UUID REFERENCES corporates(id) ON DELETE CASCADE,
  type         TEXT DEFAULT 'internal' CHECK (type IN ('internal','external')),
  message      TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collab_requests_sender_id   ON collaboration_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_receiver_id ON collaboration_requests(receiver_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — EMPLOYEE MODULE
-- ============================================================

-- ── EMPLOYEES ─────────────────────────────────────────────────────
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Same company employees can view each other
CREATE POLICY "Employees can view same company employees" ON employees
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
-- Each employee can update their own record
CREATE POLICY "Employees can update own record" ON employees
  FOR UPDATE USING (user_id = auth.uid());
-- Admins/HR can insert employees
CREATE POLICY "Admins can insert employees" ON employees
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','hr','manager'))
  );

-- ── TASKS ─────────────────────────────────────────────────────────
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Employees can view tasks assigned to them
CREATE POLICY "Employees can view own tasks" ON tasks
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager','hr','team_lead'))
  );
-- Employees can update their own assigned tasks
CREATE POLICY "Employees can update own assigned tasks" ON tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager','hr'))
  );
-- Managers/Admins can insert tasks
CREATE POLICY "Managers can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager','hr','team_lead'))
    OR created_by = auth.uid()
  );

-- ── DEPARTMENTS ────────────────────────────────────────────────────
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Same company can view departments" ON departments
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','hr'))
  );

-- ── TEAMS ──────────────────────────────────────────────────────────
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Same company can view teams" ON teams
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager','hr'))
  );

-- ── PROJECTS ───────────────────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Same company can view projects" ON projects
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Managers can manage projects" ON projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager'))
  );

-- ── PROJECT MEMBERS ────────────────────────────────────────────────
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view project_members" ON project_members
  FOR SELECT USING (
    employee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager','team_lead'))
  );
CREATE POLICY "Managers can manage project_members" ON project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager'))
  );

-- ── ANNOUNCEMENTS ──────────────────────────────────────────────────
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Same company can view announcements" ON announcements
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager','hr'))
  );

-- ── POST REACTIONS ─────────────────────────────────────────────────
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view reactions" ON post_reactions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Employees can insert own reactions" ON post_reactions
  FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees can delete own reactions" ON post_reactions
  FOR DELETE USING (employee_id = auth.uid());

-- ── POST COMMENTS ──────────────────────────────────────────────────
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view comments" ON post_comments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Employees can insert own comments" ON post_comments
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- ── NOTIFICATIONS ──────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── COLLABORATION REQUESTS ─────────────────────────────────────────
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collab requests" ON collaboration_requests
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can insert collab requests" ON collaboration_requests
  FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own sent requests" ON collaboration_requests
  FOR UPDATE USING (sender_id = auth.uid());
CREATE POLICY "Users can delete own pending requests" ON collaboration_requests
  FOR DELETE USING (sender_id = auth.uid() AND status = 'pending');

-- ── ACTIVITY LOGS (extend existing policy) ─────────────────────────
-- Allow users to view their own logs (existing policy allows insert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_logs' AND policyname = 'Users can view own activity logs'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own activity logs" ON activity_logs FOR SELECT USING (user_id = auth.uid())';
  END IF;
END $$;

-- ============================================================
-- SUPABASE REALTIME — Enable for Notifications
-- ============================================================
-- Run this to enable realtime on the notifications table:
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- SUPABASE STORAGE — Profile Photos Bucket
-- ============================================================
-- Run this in Supabase Dashboard → Storage → New Bucket
-- OR uncomment and run:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('profile-photos', 'profile-photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE!
-- ============================================================
