-- ============================================================
-- CORPLINK — UNIFIED MESSAGING & COMMUNICATIONS SCHEMA
-- ============================================================

-- 1. CHAT GROUPS (For Departments, Projects, and Broadcasts)
CREATE TABLE IF NOT EXISTS chat_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES corporates(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('department', 'project', 'broadcast', 'general')),
  reference_id UUID, -- Links to department_id or project_id if applicable
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INTERNAL MESSAGES (Unified for Direct, Dept, and Project)
CREATE TABLE IF NOT EXISTS internal_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null for group messages
  group_id     UUID REFERENCES chat_groups(id) ON DELETE CASCADE,   -- Null for direct messages
  message_text TEXT NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PARTNER MESSAGES (Corporate-to-Corporate)
CREATE TABLE IF NOT EXISTS partner_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_company UUID NOT NULL REFERENCES corporates(id) ON DELETE CASCADE,
  to_company   UUID NOT NULL REFERENCES corporates(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PARTNER REQUESTS (Collaboration)
CREATE TABLE IF NOT EXISTS partner_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_company UUID NOT NULL REFERENCES corporates(id) ON DELETE CASCADE,
  to_company   UUID NOT NULL REFERENCES corporates(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_company, to_company)
);

-- 5. NOTIFICATIONS (Already in employee_module_schema, ensuring consistency)
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES corporates(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_update', 'project_update', 'announcement', 'collaboration', 'approval', 'general')),
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_internal_msg_sender   ON internal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_internal_msg_receiver ON internal_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_internal_msg_group    ON internal_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_partner_msg_companies ON partner_messages(from_company, to_company);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id);

-- Enable RLS
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for broad access within same company)
CREATE POLICY "Users can view same company chat groups" ON chat_groups
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view relevant internal messages" ON internal_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR 
    group_id IN (SELECT id FROM chat_groups WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can insert chat groups" ON chat_groups
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert internal messages" ON internal_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE internal_messages, chat_groups, partner_messages, notifications;
