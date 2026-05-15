-- ==========================================
-- 1. CORPORATES TABLE
-- ==========================================
CREATE TABLE corporates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  rejection_reason TEXT,
  plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'standard', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 2. PROFILES TABLE
-- ==========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'corporate_admin', 'admin', 'manager', 'team_lead', 'hr', 'employee')),
  company_id UUID REFERENCES corporates(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. SUBSCRIPTIONS TABLE
-- ==========================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporate_id UUID NOT NULL REFERENCES corporates(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'standard', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ==========================================
-- 4. ACTIVITY LOGS TABLE
-- ==========================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES corporates(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  status TEXT DEFAULT 'success',
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. GLOBAL ANNOUNCEMENTS TABLE
-- ==========================================
CREATE TABLE global_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. PLATFORM SETTINGS TABLE
-- ==========================================
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporate_id UUID NOT NULL REFERENCES corporates(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(corporate_id, module_name)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE corporates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own row. Super admins can read all.
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Corporates: Super admins can read/update all. Corporate admins can read own.
CREATE POLICY "Super admins can manage all corporates" ON corporates FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Corporate admins can view own corporate" ON corporates FOR SELECT USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Subscriptions: Super admins can read/update all. Corporate admins can read own.
CREATE POLICY "Super admins can manage all subscriptions" ON subscriptions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Corporate admins can view own subscriptions" ON subscriptions FOR SELECT USING (corporate_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Activity Logs: Super admins can read all. Users can insert.
CREATE POLICY "Super admins can view all activity logs" ON activity_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Users can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Global Announcements: Super admins manage all. Authenticated users can read.
CREATE POLICY "Super admins can manage global announcements" ON global_announcements FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "All authenticated users can view active announcements" ON global_announcements FOR SELECT USING (auth.role() = 'authenticated');

-- Platform Settings: Super admins manage all. Corporates can read own.
CREATE POLICY "Super admins can manage platform settings" ON platform_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Corporate users can view own settings" ON platform_settings FOR SELECT USING (corporate_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
