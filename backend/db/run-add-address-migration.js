import { pool } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log('📦 Running migration: add-address-to-students.sql');
        
        const sqlFile = path.join(__dirname, 'add-address-to-students.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
        
        const connection = await pool.getConnection();
        
        try {
            for (const statement of statements) {
                if (statement.toLowerCase().startsWith('use ')) {
                    console.log('⏭️  Skipping USE statement');
                    continue;
                }
                
                if (statement.toLowerCase().startsWith('set @')) {
                    await connection.query(statement);
                    continue;
                }
                
                if (statement.toLowerCase().includes('prepare') || 
                    statement.toLowerCase().includes('execute') ||
                    statement.toLowerCase().includes('deallocate')) {
                    await connection.query(statement);
                    continue;
                }
                
                if (statement.toLowerCase().startsWith('select') || 
                    statement.toLowerCase().startsWith('create') ||
                    statement.toLowerCase().startsWith('alter')) {
                    const [rows] = await connection.query(statement);
                    if (Array.isArray(rows) && rows.length > 0) {
                        console.log('✅', rows[0]);
                    }
                }
            }
            
            // Verify columns were added
            const [columns] = await connection.query(`
                SELECT 
                    COLUMN_NAME, 
                    COLUMN_TYPE, 
                    IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'cnpm' 
                AND TABLE_NAME = 'students'
                AND COLUMN_NAME IN ('address', 'home_lat', 'home_lng', 'assigned_bus_id')
                ORDER BY ORDINAL_POSITION
            `);
            
            console.log('\n📋 Students table structure:');
            columns.forEach(col => {
                console.log(`  ✅ ${col.COLUMN_NAME} - ${col.COLUMN_TYPE} - Nullable: ${col.IS_NULLABLE}`);
            });
            
            console.log('\n🎉 Migration completed successfully!');
            
        } finally {
            connection.release();
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
