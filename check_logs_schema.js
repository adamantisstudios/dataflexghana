const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('maintenance_mode_logs')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching logs:', error);
  } else {
    console.log('Logs fetched successfully:', data);
  }
}

run();
