import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function debug() {
  const { data: attempts } = await supabase.from("login_attempts").select("*").limit(5)
  console.log("Login Attempts:", attempts)

  const { data: alerts } = await supabase.from("threat_alerts").select("*").limit(5)
  console.log("Threat Alerts:", alerts)
}

debug()
