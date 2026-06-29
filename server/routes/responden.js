// server/routes/responden.js
// API untuk menyimpan identitas responden & jawaban tiap babak.

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// POST /api/responden -> simpan identitas responden, return sessionId
router.post('/', (req, res) => {
  const { nama, kelas, jenisKelamin } = req.body;

  if (!nama || !kelas) {
    return res.status(400).json({ error: 'Nama dan kelas wajib diisi' });
  }

  const sessionId = 'sesi_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  
  const sql = `INSERT INTO responden (nama, kelas, jenisKelamin, session_id) VALUES (?, ?, ?, ?)`;
  db.run(sql, [nama, kelas, jenisKelamin, sessionId], function(err) {
    if (err) {
      console.error('Gagal simpan responden:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    console.log('Responden baru:', { nama, kelas, jenisKelamin, sessionId });
    res.json({ sessionId: sessionId });
  });
});

// POST /api/responden/jawaban -> simpan satu jawaban (babak, soal, latency, dst)
router.post('/jawaban', (req, res) => {
  // Karena babak 1 "soal" adalah index, kita terima soalIndex lalu kita tangkap soal teksnya (opsional) atau simpan sesuai request
  const { sessionId, babak, soalIndex, jawaban, benar, latencyMs, soalTeks } = req.body;

  // Jika front-end tidak kirim soalTeks, kita string-kan soalIndex saja
  const soal = soalTeks || `Soal ${soalIndex}`;

  const sql = `INSERT INTO jawaban (session_id, babak, soal, jawaban, benar, latency_ms) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [sessionId, babak, soal, jawaban, benar ? 1 : 0, latencyMs], function(err) {
    if (err) {
      console.error('Gagal simpan jawaban:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    console.log('Jawaban masuk:', { sessionId, babak, soal, jawaban, benar, latencyMs });
    res.json({ ok: true });
  });
});

// POST /api/responden/waktu -> simpan waktu penyelesaian babak
router.post('/waktu', (req, res) => {
  const { sessionId, babak, waktuDetik, skor } = req.body;

  if (!sessionId || !babak || waktuDetik === undefined) {
    return res.status(400).json({ error: 'sessionId, babak, dan waktuDetik wajib diisi' });
  }

  const sql = `INSERT INTO waktu_babak (session_id, babak, waktu_detik, skor) VALUES (?, ?, ?, ?)`;
  db.run(sql, [sessionId, babak, waktuDetik, skor || 0], function(err) {
    if (err) {
      console.error('Gagal simpan waktu:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    console.log('Waktu babak masuk:', { sessionId, babak, waktuDetik, skor });
    res.json({ ok: true });
  });
});

// GET /api/responden/leaderboard -> ambil ranking pemain (skor tertinggi, waktu tercepat)
router.get('/leaderboard', (req, res) => {
  const sql = `
    SELECT 
      r.nama,
      r.kelas,
      r.session_id,
      COALESCE(SUM(w.skor), 0) as total_skor,
      COALESCE(SUM(w.waktu_detik), 0) as total_waktu,
      MAX(CASE WHEN w.babak = 1 THEN w.waktu_detik END) as waktu_babak1,
      MAX(CASE WHEN w.babak = 2 THEN w.waktu_detik END) as waktu_babak2,
      MAX(CASE WHEN w.babak = 3 THEN w.waktu_detik END) as waktu_babak3,
      MAX(CASE WHEN w.babak = 1 THEN w.skor END) as skor_babak1,
      MAX(CASE WHEN w.babak = 2 THEN w.skor END) as skor_babak2,
      MAX(CASE WHEN w.babak = 3 THEN w.skor END) as skor_babak3
    FROM responden r
    LEFT JOIN waktu_babak w ON r.session_id = w.session_id
    GROUP BY r.session_id
    HAVING total_waktu > 0
    ORDER BY total_skor DESC, total_waktu ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error leaderboard:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(rows);
  });
});

module.exports = router;
