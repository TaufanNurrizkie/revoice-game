const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Buat tabel jika belum ada
    db.serialize(() => {
      // Tabel responden
      db.run(`CREATE TABLE IF NOT EXISTS responden (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        kelas TEXT NOT NULL,
        jenisKelamin TEXT,
        session_id TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabel jawaban_babak1 (dan babak lainnya, digabung agar mudah diekspor)
      db.run(`CREATE TABLE IF NOT EXISTS jawaban (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        babak INTEGER NOT NULL,
        soal TEXT NOT NULL,
        jawaban TEXT NOT NULL,
        benar BOOLEAN,
        latency_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES responden (session_id)
      )`);
    });
  }
});

module.exports = db;
