import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'superparent_secure_store';
const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

export const storage = {
  /**
   * Initializes the SQLite database and creates the KV table.
   * Runs only once per app lifecycle.
   */
  init: async (): Promise<void> => {
    if (db || !Capacitor.isNativePlatform()) return;
    
    try {
      // Create/Connect to the database
      db = await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
      await db.open();

      // Create a unified Key-Value store table
      const schema = `
        CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `;
      await db.execute(schema);
      console.log('SQLite: Database initialized successfully');
    } catch (err) {
      console.error('SQLite: Critical Initialization Error:', err);
      // Logic continues; methods will fallback to localStorage if db is null
    }
  },

  /**
   * Retrieves data from SQLite. Falls back to localStorage and 
   * performs a one-time migration if needed.
   */
  get: async <T,>(key: string, defaultValue: T): Promise<T> => {
    const localVal = localStorage.getItem(key);
    
    if (db) {
      try {
        const query = `SELECT value FROM kv_store WHERE key = ?;`;
        const res = await db.query(query, [key]);
        
        if (res.values && res.values.length > 0) {
          return JSON.parse(res.values[0].value);
        } else if (localVal !== null) {
          // One-time Migration: SQLite exists but key is only in localStorage
          console.log(`SQLite: Migrating key "${key}" from localStorage...`);
          const parsed = JSON.parse(localVal);
          await storage.set(key, parsed);
          localStorage.removeItem(key); 
          return parsed;
        }
      } catch (err) {
        console.warn(`SQLite: Read error for ${key}, using defaults`, err);
      }
    }
    
    // Web Fallback / Native Failure
    if (localVal !== null) {
        try { return JSON.parse(localVal); } catch { return defaultValue; }
    }
    return defaultValue;
  },

  /**
   * Persists data to SQLite (Native) or localStorage (Web).
   */
  set: async <T,>(key: string, value: T): Promise<void> => {
    const jsonValue = JSON.stringify(value);
    
    if (db) {
      try {
        const query = `INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?);`;
        await db.run(query, [key, jsonValue]);
        return;
      } catch (err) {
        console.error(`SQLite: Write error for ${key}`, err);
      }
    }
    
    // Web Fallback
    localStorage.setItem(key, jsonValue);
  },

  /**
   * Destructive clear for debug/reset.
   */
  clearAll: async (): Promise<void> => {
    if (db) {
      try {
        await db.execute(`DELETE FROM kv_store;`);
      } catch (err) {
        console.error('SQLite: Clear error', err);
      }
    }
    localStorage.clear();
  }
};