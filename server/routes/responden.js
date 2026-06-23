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

module.exports = router;
