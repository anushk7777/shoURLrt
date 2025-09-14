/**
 * Database Status Checker
 * 
 * This script checks the actual status of database tables in Supabase
 * and verifies that real tables exist (not mocks).
 * 
 * @author Dev Agent (James)
 * @version 1.0
 * @date 2024-03-14
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabase } from '../src/lib/supabase';
import { createLinksTable, validateLinksTable } from '../src/lib/migrations';

/**
 * Interface for database status information
 */
interface DatabaseStatus {
  tableExists: boolean;
  tableStructure?: any;
  recordCount?: number;
  indexes?: any[];
  constraints?: any[];
  error?: string;
}

/**
 * Checks if the links table actually exists in the database
 * @returns Promise<DatabaseStatus> - Current status of the links table
 */
export async function checkLinksTableStatus(): Promise<DatabaseStatus> {
  try {
    console.log('🔍 Checking actual database table status...');
    
    // Test 1: Try to query the table directly
    const { data: tableData, error: tableError } = await supabase
      .from('links')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
        return {
          tableExists: false,
          error: `Table does not exist: ${tableError.message}`
        };
      }
      return {
        tableExists: false,
        error: `Database error: ${tableError.message}`
      };
    }

    // Test 2: Get table structure information
    const { data: structureData, error: structureError } = await supabase
      .rpc('get_table_info', { table_name: 'links' })
      .single();

    // Test 3: Count existing records
    const { count, error: countError } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true });

    // Test 4: Check table schema using information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = 'links' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    return {
      tableExists: true,
      tableStructure: schemaData || 'Schema query not supported',
      recordCount: count || 0,
      error: schemaError ? `Schema check failed: ${schemaError.message}` : undefined
    };

  } catch (error) {
    return {
      tableExists: false,
      error: `Unexpected error: ${error}`
    };
  }
}

/**
 * Creates the actual database table and verifies it exists
 * @returns Promise<void>
 */
export async function createAndVerifyTable(): Promise<void> {
  console.log('🚀 Creating actual database table...');
  
  try {
    // Step 1: Create the table
    const createResult = await createLinksTable();
    console.log(`📝 Create result: ${createResult.success ? '✅' : '❌'} ${createResult.message}`);
    
    if (createResult.error) {
      console.error('❌ Create error details:', createResult.error);
    }

    // Step 2: Validate the table
    const validateResult = await validateLinksTable();
    console.log(`🔍 Validation result: ${validateResult.success ? '✅' : '❌'} ${validateResult.message}`);
    
    if (validateResult.error) {
      console.error('❌ Validation error details:', validateResult.error);
    }

    // Step 3: Check actual status
    const status = await checkLinksTableStatus();
    console.log('\n📊 Final Database Status:');
    console.log(`Table exists: ${status.tableExists ? '✅ YES' : '❌ NO'}`);
    
    if (status.tableExists) {
      console.log(`Record count: ${status.recordCount}`);
      if (status.tableStructure && typeof status.tableStructure === 'object') {
        console.log('Table structure:', JSON.stringify(status.tableStructure, null, 2));
      }
    }
    
    if (status.error) {
      console.error('⚠️  Status check error:', status.error);
    }

  } catch (error) {
    console.error('💥 Unexpected error during table creation:', error);
  }
}

/**
 * Test actual database operations (insert, select, update, delete)
 * @returns Promise<void>
 */
export async function testDatabaseOperations(): Promise<void> {
  console.log('\n🧪 Testing actual database operations...');
  
  try {
    const testShortCode = `test_${Date.now()}`;
    const testUrl = 'https://example.com/test';

    // Test INSERT
    console.log('📝 Testing INSERT operation...');
    const { data: insertData, error: insertError } = await supabase
      .from('links')
      .insert({
        short_code: testShortCode,
        long_url: testUrl,
        click_count: 0
      })
      .select();

    if (insertError) {
      console.error('❌ INSERT failed:', insertError.message);
      return;
    }
    console.log('✅ INSERT successful:', insertData);

    // Test SELECT
    console.log('🔍 Testing SELECT operation...');
    const { data: selectData, error: selectError } = await supabase
      .from('links')
      .select('*')
      .eq('short_code', testShortCode)
      .single();

    if (selectError) {
      console.error('❌ SELECT failed:', selectError.message);
    } else {
      console.log('✅ SELECT successful:', selectData);
    }

    // Test UPDATE
    console.log('📝 Testing UPDATE operation...');
    const { data: updateData, error: updateError } = await supabase
      .from('links')
      .update({ click_count: 1 })
      .eq('short_code', testShortCode)
      .select();

    if (updateError) {
      console.error('❌ UPDATE failed:', updateError.message);
    } else {
      console.log('✅ UPDATE successful:', updateData);
    }

    // Test DELETE (cleanup)
    console.log('🗑️  Testing DELETE operation...');
    const { error: deleteError } = await supabase
      .from('links')
      .delete()
      .eq('short_code', testShortCode);

    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError.message);
    } else {
      console.log('✅ DELETE successful - test record cleaned up');
    }

  } catch (error) {
    console.error('💥 Database operations test failed:', error);
  }
}

/**
 * Main function to run all database status checks
 */
export async function main(): Promise<void> {
  console.log('🎯 URL Shortener Database Status Check');
  console.log('=====================================\n');

  // Check current status
  const initialStatus = await checkLinksTableStatus();
  console.log('📊 Initial Status:');
  console.log(`Table exists: ${initialStatus.tableExists ? '✅ YES' : '❌ NO'}`);
  
  if (!initialStatus.tableExists) {
    console.log('❌ Table does not exist. Creating it now...');
    await createAndVerifyTable();
  } else {
    console.log('✅ Table already exists!');
    console.log(`Record count: ${initialStatus.recordCount}`);
  }

  // Test database operations
  await testDatabaseOperations();

  console.log('\n🎉 Database status check completed!');
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}