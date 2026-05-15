-- ── TASK ATTACHMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for task_attachments
CREATE POLICY "Users can view attachments for their tasks" ON task_attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks WHERE id = task_attachments.task_id AND (assigned_to = auth.uid() OR created_by = auth.uid()))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager'))
  );

CREATE POLICY "Users can upload attachments for their tasks" ON task_attachments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND assigned_to = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','corporate_admin','manager'))
  );

-- ── PROJECT JOINING POLICY ─────────────────────────────────────────
-- Allow employees to join projects in their company
CREATE POLICY "Employees can join projects" ON project_members
  FOR INSERT WITH CHECK (
    employee_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );
