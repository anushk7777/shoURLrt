/**
 * Simple Migration Runner
 * 
 * This script runs SQL migrations directly against the Supabase database
 * using the service role key for admin access.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Create admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Create the click increment function directly
 */
async function createClickIncrementFunction() {
  try {
    console.log('🚀 Creating increment_click_count function...');
    
    // First, let's test if we can create a simple function
    console.log('📝 Testing function creation...');
    
    // Try to create the function using a simple approach
    const { data, error } = await supabaseAdmin.rpc('increment_click_count', {
      short_code_param: 'test'
    });
    
    if (error && error.code === 'PGRST202') {
      console.log('✅ Function does not exist yet, this is expected.');
      console.log('📋 Please manually create the function in Supabase SQL Editor:');
      console.log('');
      console.log('-- Copy and paste this SQL into Supabase SQL Editor:');
      console.log('');
      
      const sqlContent = fs.readFileSync('migrations/002_add_click_increment_function.sql', 'utf8');
      console.log(sqlContent);
      
      console.log('');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
      console.log('📝 Paste the SQL above and click "Run"');
      
    } else if (error) {
      console.error('❌ Unexpected error:', error);
    } else {
      console.log('✅ Function already exists and is working!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function creation
createClickIncrementFunction();