import { supabase } from "../lib/supabase"

/**
 * Logs a module usage event to Supabase
 * @param {string} moduleName - Name of the module (e.g., 'Tasks', 'Messaging')
 * @param {string} corporateId - ID of the corporate/company
 * @param {string} userId - ID of the user
 */
export const logModuleUsage = async (moduleName, corporateId, userId) => {
  if (!moduleName || !corporateId || !userId) return
  
  try {
    await supabase.from("module_usage_logs").insert([
      {
        module_name: moduleName,
        corporate_id: corporateId,
        user_id: userId
      }
    ])
  } catch (error) {
    console.error("Failed to log module usage:", error)
  }
}
