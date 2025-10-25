import { pool } from './connection.js';
import fs from 'fs';

async function optimize() {
    const sql = fs.readFileSync('./optimize-database.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    const connection = await pool.getConnection();
    
    try {
        console.log('🔧 Optimizing database...\n');
        
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (!trimmed) continue;
            
            try {
                await connection.query(trimmed);
                // Extract action from SQL
                const action = trimmed.substring(0, 50).replace(/\n/g, ' ');
                console.log('✓', action + '...');
            } catch (err) {
                // Ignore errors for DROP IF EXISTS or ADD INDEX if exists
                if (!err.message.includes('Duplicate key') && 
                    !err.message.includes('check that it exists') &&
                    !err.message.includes('already exists')) {
                    console.warn('⚠️ ', err.message.substring(0, 100));
                }
            }
        }
        
        console.log('\n✅ Database optimization complete!');
        
    } finally {
        connection.release();
        process.exit(0);
    }
}

optimize();
