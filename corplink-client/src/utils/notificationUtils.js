import { supabase } from "../lib/supabase"

/**
 * Global Utility for Generating Corporate Notifications
 * @param {string} userId - ID of the user to receive the notification
 * @param {string} companyId - ID of the corporate company
 * @param {string} type - Notification category (task_assigned, task_update, etc.)
 * @param {string} message - Descriptive content for the user
 */
export const createNotification = async (userId, companyId, type, message) => {
  if (!userId || !companyId) return

  try {
    const { error } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        company_id: companyId,
        type: type,
        message: message,
        is_read: false
      }
    ])
    if (error) console.error("Notification Generation Error:", error)
  } catch (err) {
    console.error("Critical Notification Error:", err)
  }
}
