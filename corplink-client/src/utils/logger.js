import { supabase } from "../lib/supabase"

export const logAdminActivity = async ({ 
  company_id, 
  user_id, 
  action, 
  entity, 
  severity = "info", 
  status = "success" 
}) => {
  console.log("Calling logAdminActivity with:", { company_id, user_id, action, entity });
  if (!user_id) {
    console.warn("logAdminActivity aborted: No user_id provided");
    return;
  }

  try {
    const { error } = await supabase.from("activity_logs").insert([{
      company_id: company_id || null,
      user_id,
      action,
      entity,
      severity,
      status
    }])
    if (error) {
      console.error("Supabase insert error in logger:", error)
    }
  } catch (err) {
    console.error("Failed to log activity:", err)
  }
}

