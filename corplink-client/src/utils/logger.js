import { supabase } from "../lib/supabase"

export const logAdminActivity = async ({ 
  company_id, 
  user_id, 
  action, 
  entity, 
  severity = "info", 
  status = "success" 
}) => {
  if (!company_id || !user_id) return

  try {
    await supabase.from("activity_logs").insert([{
      company_id,
      user_id,
      action,
      entity,
      severity,
      status
    }])
  } catch (err) {
    console.error("Failed to log activity:", err)
  }
}
