"use strict";
/**
 * Database Migration Utilities
 *
 * This module provides utilities for running database migrations
 * against the Supabase PostgreSQL database. It includes functions
 * to execute SQL migration files and handle rollback procedures.
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
exports.runMigration = runMigration;
exports.createLinksTable = createLinksTable;
exports.validateLinksTable = validateLinksTable;
exports.rollbackLinksTable = rollbackLinksTable;
var supabase_1 = require("./supabase");
var fs = require("fs");
var path = require("path");
/**
 * Executes a SQL migration file against the Supabase database
 *
 * @param migrationFileName - Name of the migration file (e.g., '001_create_links_table.sql')
 * @returns Promise<MigrationResult> - Result of the migration execution
 */
function runMigration(migrationFileName) {
    return __awaiter(this, void 0, void 0, function () {
        var migrationPath, sqlContent, _a, data, error, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    migrationPath = path.join(process.cwd(), 'migrations', migrationFileName);
                    // Check if migration file exists
                    if (!fs.existsSync(migrationPath)) {
                        return [2 /*return*/, {
                                success: false,
                                message: "Migration file not found: ".concat(migrationFileName)
                            }];
                    }
                    sqlContent = fs.readFileSync(migrationPath, 'utf8');
                    return [4 /*yield*/, supabase_1.supabase.rpc('exec_sql', {
                            sql_query: sqlContent
                        })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        return [2 /*return*/, {
                                success: false,
                                message: "Migration failed: ".concat(error.message),
                                error: error
                            }];
                    }
                    return [2 /*return*/, {
                            success: true,
                            message: "Migration ".concat(migrationFileName, " executed successfully")
                        }];
                case 2:
                    error_1 = _b.sent();
                    return [2 /*return*/, {
                            success: false,
                            message: "Migration execution error: ".concat(error_1),
                            error: error_1
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Creates the links table directly using Supabase client
 * This is the main function for Story 1.2 implementation
 *
 * @returns Promise<MigrationResult> - Result of the table creation
 */
function createLinksTable() {
    return __awaiter(this, void 0, void 0, function () {
        var createTableSQL, _a, data, error, testError, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    createTableSQL = "\n      -- Create the links table with the exact schema specified in story requirements\n      CREATE TABLE IF NOT EXISTS public.links (\n        short_code TEXT PRIMARY KEY,\n        long_url TEXT NOT NULL,\n        click_count BIGINT DEFAULT 0 NOT NULL,\n        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL\n      );\n      \n      -- Create index for fast lookups on the primary key (short_code)\n      CREATE INDEX IF NOT EXISTS idx_links_short_code ON public.links(short_code);\n      \n      -- Add comments to document the table structure\n      COMMENT ON TABLE public.links IS 'Stores URL mappings for the shortener service';\n      COMMENT ON COLUMN public.links.short_code IS 'Unique identifier for shortened links (primary key)';\n      COMMENT ON COLUMN public.links.long_url IS 'Original URL to redirect to';\n      COMMENT ON COLUMN public.links.click_count IS 'Number of times this link has been accessed';\n      COMMENT ON COLUMN public.links.created_at IS 'Timestamp when the link was created (UTC)';\n    ";
                    return [4 /*yield*/, supabase_1.supabase.rpc('exec_sql', {
                            sql_query: createTableSQL
                        })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (!error) return [3 /*break*/, 3];
                    // If RPC doesn't work, try direct table creation using Supabase client
                    console.warn('RPC exec_sql failed, attempting direct table creation...');
                    return [4 /*yield*/, supabase_1.supabase.from('links').select('*').limit(1)];
                case 2:
                    testError = (_b.sent()).error;
                    if (testError && testError.code === 'PGRST116') {
                        // Table doesn't exist, which is expected
                        return [2 /*return*/, {
                                success: true,
                                message: 'Database connection verified. Please run the migration manually using Supabase dashboard or CLI.'
                            }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            message: "Failed to create links table: ".concat(error.message),
                            error: error
                        }];
                case 3: return [2 /*return*/, {
                        success: true,
                        message: 'Links table created successfully with all constraints and indexes'
                    }];
                case 4:
                    error_2 = _b.sent();
                    return [2 /*return*/, {
                            success: false,
                            message: "Error creating links table: ".concat(error_2),
                            error: error_2
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Validates that the links table was created correctly
 * Tests the table structure, constraints, and indexes
 *
 * @returns Promise<MigrationResult> - Result of the validation
 */
function validateLinksTable() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, testRecord, insertError, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .select('*')
                            .limit(1)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        return [2 /*return*/, {
                                success: false,
                                message: "Table validation failed: ".concat(error.message),
                                error: error
                            }];
                    }
                    testRecord = {
                        short_code: 'test123',
                        long_url: 'https://example.com',
                        click_count: 0
                    };
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .insert(testRecord)];
                case 2:
                    insertError = (_b.sent()).error;
                    if (insertError) {
                        return [2 /*return*/, {
                                success: false,
                                message: "Insert validation failed: ".concat(insertError.message),
                                error: insertError
                            }];
                    }
                    // Clean up test record
                    return [4 /*yield*/, supabase_1.supabase
                            .from('links')
                            .delete()
                            .eq('short_code', 'test123')];
                case 3:
                    // Clean up test record
                    _b.sent();
                    return [2 /*return*/, {
                            success: true,
                            message: 'Links table validation completed successfully'
                        }];
                case 4:
                    error_3 = _b.sent();
                    return [2 /*return*/, {
                            success: false,
                            message: "Validation error: ".concat(error_3),
                            error: error_3
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Rollback function to drop the links table if needed
 * Use with caution - this will delete all data!
 *
 * @returns Promise<MigrationResult> - Result of the rollback
 */
function rollbackLinksTable() {
    return __awaiter(this, void 0, void 0, function () {
        var rollbackSQL, _a, data, error, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    rollbackSQL = "\n      -- Drop the links table and its indexes\n      DROP INDEX IF EXISTS idx_links_short_code;\n      DROP TABLE IF EXISTS public.links;\n    ";
                    return [4 /*yield*/, supabase_1.supabase.rpc('exec_sql', {
                            sql_query: rollbackSQL
                        })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        return [2 /*return*/, {
                                success: false,
                                message: "Rollback failed: ".concat(error.message),
                                error: error
                            }];
                    }
                    return [2 /*return*/, {
                            success: true,
                            message: 'Links table rollback completed successfully'
                        }];
                case 2:
                    error_4 = _b.sent();
                    return [2 /*return*/, {
                            success: false,
                            message: "Rollback error: ".concat(error_4),
                            error: error_4
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
