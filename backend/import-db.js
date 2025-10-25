import fs from 'fs';
import { pool } from './db/connection.js';

async function importDatabase() {
    try {
        console.log('Reading database.sql file...');
        const sql = fs.readFileSync('./db/database.sql', 'utf8');
        
        // Split by semicolon and filter empty statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log(`Found ${statements.length} SQL statements`);
        console.log('Executing statements...\n');
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments
            if (statement.startsWith('--') || statement.startsWith('/*')) {
                continue;
            }
            
            try {
                await pool.query(statement);
                
                // Show progress for important statements
                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE\s+(\w+)/i)?.[1];
                    console.log(`✓ Created table: ${tableName}`);
                } else if (statement.includes('INSERT')) {
                    const tableName = statement.match(/INSERT\s+IGNORE\s+INTO\s+(\w+)/i)?.[1];
                    if (tableName) console.log(`✓ Inserted data into: ${tableName}`);
                } else if (statement.includes('SELECT')) {
                    const [rows] = await pool.query(statement);
                    console.log('\n=== Database Status ===');
                    console.log(rows);
                }
            } catch (err) {
                // Ignore certain errors
                if (err.code === 'ER_TABLE_EXISTS_ALREADY' || 
                    err.code === 'ER_DUP_ENTRY' ||
                    err.message.includes('already exists')) {
                    continue;
                }
                console.error(`Error executing statement ${i + 1}:`, statement.substring(0, 100));
                console.error('Error:', err.message);
            }
        }
        
        console.log('\n✅ Database import completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Import failed:', err);
        process.exit(1);
    }
}

importDatabase();
