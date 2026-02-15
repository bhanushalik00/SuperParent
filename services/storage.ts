import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'superparent_v1';
const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

export const storage = {
  init: async (): Promise<void> => {
    if (db) return;
    
    try {
      // Create and open the database
      db = await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
      await db.open();

      // Create a unified Key-Value store table if it doesn't exist
      const schema = `
        CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `;
      await db.execute(schema);
      console.log('SQLite Database initialized');
    } catch (err) {
      console.error('SQLite Initialization Error:', err);
      // Fallback: If native SQLite fails (e.g. in non-native browser), 
      // the set/get methods will fallback to localStorage gracefully.
    }
  },

  get: async <T,>(key: string, defaultValue: T): Promise<T> => {
    // Legacy migration check: If SQLite is empty but localStorage has data, prefer localStorage once.
    const localVal = localStorage.getItem(key);
    
    if (db) {
      try {
        const query = `SELECT value FROM kv_store WHERE key = ?;`;
        const res = await db.query(query, [key]);
        
        if (res.values && res.values.length > 0) {
          return JSON.parse(res.values[0].value);
        } else if (localVal) {
          // Migrate from localStorage to SQLite
          const parsed = JSON.parse(localVal);
          await storage.set(key, parsed);
          localStorage.removeItem(key); // Cleanup
          return parsed;
        }
      } catch (err) {
        console.warn(`SQLite read error for ${key}, falling back to defaults`, err);
      }
    }
    
    // Fallback for non-native or failed DB
    if (localVal) {
        try { return JSON.parse(localVal); } catch { return defaultValue; }
    }
    return defaultValue;
  },

  set: async <T,>(key: string, value: T): Promise<void> => {
    const jsonValue = JSON.stringify(value);
    
    if (db) {
      try {
        const query = `INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?);`;
        await db.run(query, [key, jsonValue]);
        return;
      } catch (err) {
        console.error(`SQLite write error for ${key}`, err);
      }
    }
    
    // Fallback
    localStorage.setItem(key, jsonValue);
  },

  clearAll: async (): Promise<void> => {
    if (db) {
      await db.execute(`DELETE FROM kv_store;`);
    }
    localStorage.clear();
  }
};