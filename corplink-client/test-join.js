import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
      .from('partner_requests')
      .select(`
        from_company,
        to_company,
        fc:companies!from_company (id, name),
        tc:companies!to_company (id, name)
      `)
      .limit(1);
  console.log('DATA:', JSON.stringify(data, null, 2));
  console.log('ERROR:', error);
}
run();
