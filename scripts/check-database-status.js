"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLinksTableStatus = checkLinksTableStatus;
exports.createAndVerifyTable = createAndVerifyTable;
exports.testDatabaseOperations = testDatabaseOperations;
exports.main = main;
var supabase_1 = require("../src/lib/supabase");
var migrations_1 = require("../src/lib/migrations");
/**
 * Checks if the links table actually exists in the database
 * @returns Promise<DatabaseStatus> - Current status of the links table
 */
function checkLinksTableStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, tableData, tableError, _b, structureData, structureError, _c, count, countError, _d, schemaData, schemaError, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 5, , 6]);
                    console.log('🔍 Checking actual database table status...');
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .select('*')
                            .limit(1)];
                case 1:
                    _a = _e.sent(), tableData = _a.data, tableError = _a.error;
                    if (tableError) {
                        if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
                            return [2 /*return*/, {
                                    tableExists: false,
                                    error: "Table does not exist: ".concat(tableError.message)
                                }];
                        }
                        return [2 /*return*/, {
                                tableExists: false,
                                error: "Database error: ".concat(tableError.message)
                            }];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .rpc('get_table_info', { table_name: 'links' })
                            .single()];
                case 2:
                    _b = _e.sent(), structureData = _b.data, structureError = _b.error;
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .select('*', { count: 'exact', head: true })];
                case 3:
                    _c = _e.sent(), count = _c.count, countError = _c.error;
                    return [4 /*yield*/, supabase_1.supabase
                            .rpc('exec_sql', {
                            sql_query: "\n          SELECT \n            column_name,\n            data_type,\n            is_nullable,\n            column_default,\n            character_maximum_length\n          FROM information_schema.columns \n          WHERE table_name = 'links' \n          AND table_schema = 'public'\n          ORDER BY ordinal_position;\n        "
                        })];
                case 4:
                    _d = _e.sent(), schemaData = _d.data, schemaError = _d.error;
                    return [2 /*return*/, {
                            tableExists: true,
                            tableStructure: schemaData || 'Schema query not supported',
                            recordCount: count || 0,
                            error: schemaError ? "Schema check failed: ".concat(schemaError.message) : undefined
                        }];
                case 5:
                    error_1 = _e.sent();
                    return [2 /*return*/, {
                            tableExists: false,
                            error: "Unexpected error: ".concat(error_1)
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Creates the actual database table and verifies it exists
 * @returns Promise<void>
 */
function createAndVerifyTable() {
    return __awaiter(this, void 0, void 0, function () {
        var createResult, validateResult, status_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Creating actual database table...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, (0, migrations_1.createLinksTable)()];
                case 2:
                    createResult = _a.sent();
                    console.log("\uD83D\uDCDD Create result: ".concat(createResult.success ? '✅' : '❌', " ").concat(createResult.message));
                    if (createResult.error) {
                        console.error('❌ Create error details:', createResult.error);
                    }
                    return [4 /*yield*/, (0, migrations_1.validateLinksTable)()];
                case 3:
                    validateResult = _a.sent();
                    console.log("\uD83D\uDD0D Validation result: ".concat(validateResult.success ? '✅' : '❌', " ").concat(validateResult.message));
                    if (validateResult.error) {
                        console.error('❌ Validation error details:', validateResult.error);
                    }
                    return [4 /*yield*/, checkLinksTableStatus()];
                case 4:
                    status_1 = _a.sent();
                    console.log('\n📊 Final Database Status:');
                    console.log("Table exists: ".concat(status_1.tableExists ? '✅ YES' : '❌ NO'));
                    if (status_1.tableExists) {
                        console.log("Record count: ".concat(status_1.recordCount));
                        if (status_1.tableStructure && typeof status_1.tableStructure === 'object') {
                            console.log('Table structure:', JSON.stringify(status_1.tableStructure, null, 2));
                        }
                    }
                    if (status_1.error) {
                        console.error('⚠️  Status check error:', status_1.error);
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.error('💥 Unexpected error during table creation:', error_2);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test actual database operations (insert, select, update, delete)
 * @returns Promise<void>
 */
function testDatabaseOperations() {
    return __awaiter(this, void 0, void 0, function () {
        var testShortCode, testUrl, _a, insertData, insertError, _b, selectData, selectError, _c, updateData, updateError, deleteError, error_3;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('\n🧪 Testing actual database operations...');
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, , 7]);
                    testShortCode = "test_".concat(Date.now());
                    testUrl = 'https://example.com/test';
                    // Test INSERT
                    console.log('📝 Testing INSERT operation...');
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .insert({
                            short_code: testShortCode,
                            long_url: testUrl,
                            click_count: 0
                        })
                            .select()];
                case 2:
                    _a = _d.sent(), insertData = _a.data, insertError = _a.error;
                    if (insertError) {
                        console.error('❌ INSERT failed:', insertError.message);
                        return [2 /*return*/];
                    }
                    console.log('✅ INSERT successful:', insertData);
                    // Test SELECT
                    console.log('🔍 Testing SELECT operation...');
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .select('*')
                            .eq('short_code', testShortCode)
                            .single()];
                case 3:
                    _b = _d.sent(), selectData = _b.data, selectError = _b.error;
                    if (selectError) {
                        console.error('❌ SELECT failed:', selectError.message);
                    }
                    else {
                        console.log('✅ SELECT successful:', selectData);
                    }
                    // Test UPDATE
                    console.log('📝 Testing UPDATE operation...');
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .update({ click_count: 1 })
                            .eq('short_code', testShortCode)
                            .select()];
                case 4:
                    _c = _d.sent(), updateData = _c.data, updateError = _c.error;
                    if (updateError) {
                        console.error('❌ UPDATE failed:', updateError.message);
                    }
                    else {
                        console.log('✅ UPDATE successful:', updateData);
                    }
                    // Test DELETE (cleanup)
                    console.log('🗑️  Testing DELETE operation...');
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .delete()
                            .eq('short_code', testShortCode)];
                case 5:
                    deleteError = (_d.sent()).error;
                    if (deleteError) {
                        console.error('❌ DELETE failed:', deleteError.message);
                    }
                    else {
                        console.log('✅ DELETE successful - test record cleaned up');
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _d.sent();
                    console.error('💥 Database operations test failed:', error_3);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Main function to run all database status checks
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var initialStatus;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🎯 URL Shortener Database Status Check');
                    console.log('=====================================\n');
                    return [4 /*yield*/, checkLinksTableStatus()];
                case 1:
                    initialStatus = _a.sent();
                    console.log('📊 Initial Status:');
                    console.log("Table exists: ".concat(initialStatus.tableExists ? '✅ YES' : '❌ NO'));
                    if (!!initialStatus.tableExists) return [3 /*break*/, 3];
                    console.log('❌ Table does not exist. Creating it now...');
                    return [4 /*yield*/, createAndVerifyTable()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    console.log('✅ Table already exists!');
                    console.log("Record count: ".concat(initialStatus.recordCount));
                    _a.label = 4;
                case 4: 
                // Test database operations
                return [4 /*yield*/, testDatabaseOperations()];
                case 5:
                    // Test database operations
                    _a.sent();
                    console.log('\n🎉 Database status check completed!');
                    return [2 /*return*/];
            }
        });
    });
}
// Run the script if called directly
if (require.main === module) {
    main().catch(console.error);
}
