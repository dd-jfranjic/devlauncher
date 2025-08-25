const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://dqojxehwqjjyvmvrpuzm.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_91XyHuNNEW1MYCCb48sWFQ_CZmzQFLi'; // service_role key

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Archon database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'archon', 'migration', 'complete_setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    });
    
    if (response.ok) {
      console.log('✅ Database setup completed successfully!');
      console.log('📝 All Archon tables and functions have been created.');
      console.log('🔧 You can now start Archon services.');
    } else {
      // Try alternative method - direct execution
      console.log('⚠️  REST API method failed, trying direct SQL execution...');
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`📊 Executing ${statements.length} SQL statements...`);
      
      let successCount = 0;
      for (const [index, statement] of statements.entries()) {
        try {
          const execResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY
            },
            body: JSON.stringify({
              sql: statement + ';'
            })
          });
          
          if (execResponse.ok) {
            successCount++;
          } else {
            const error = await execResponse.text();
            console.log(`⚠️  Statement ${index + 1} failed: ${statement.substring(0, 50)}...`);
          }
        } catch (err) {
          console.log(`❌ Error executing statement ${index + 1}:`, err.message);
        }
      }
      
      console.log(`✅ Successfully executed ${successCount}/${statements.length} statements`);
    }
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    
    // Provide manual instructions
    console.log('\n📋 Manual setup instructions:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: archon/migration/complete_setup.sql');
    console.log('4. Run the script to create all required tables and functions');
  }
}

// Run the setup
setupDatabase();