import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'superparent_secure_store';
const sqlite = new SQLiteConnection(CapacitorSQLite);
let db = null;

export const storage = {
  init: async () => {
    if (db || !Capacitor.isNativePlatform()) return;
    
    try {
      db = await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
      await db.open();

      const schema = `
        CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `;
      await db.execute(schema);
      console.log('SQLite: Ready');
    } catch (err) {
      console.error('SQLite Init Error:', err);
    }
  },

  get: async (key, defaultValue) => {
    const localVal = localStorage.getItem(key);
    
    if (db) {
      try {
        const res = await db.query(`SELECT value FROM kv_store WHERE key = ?;`, [key]);
        if (res.values && res.values.length > 0) {
          return JSON.parse(res.values[0].value);
        } else if (localVal !== null) {
          const parsed = JSON.parse(localVal);
          await storage.set(key, parsed);
          localStorage.removeItem(key); 
          return parsed;
        }
      } catch (err) {
        console.warn(`SQLite read error for ${key}`, err);
      }
    }
    
    if (localVal !== null) {
      try { return JSON.parse(localVal); } catch { return defaultValue; }
    }
    return defaultValue;
  },

  set: async (key, value) => {
    const jsonValue = JSON.stringify(value);
    if (db) {
      try {
        await db.run(`INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?);`, [key, jsonValue]);
        return;
      } catch (err) {
        console.error(`SQLite write error for ${key}`, err);
      }
    }
    localStorage.setItem(key, jsonValue);
  },

  clearAll: async () => {
    if (db) await db.execute(`DELETE FROM kv_store;`);
    localStorage.clear();
  }
};