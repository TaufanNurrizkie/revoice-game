// server/routes/admin.js
// API untuk halaman admin: rekap waktu pemain, filter per kelas

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/admin/rekap -> data lengkap semua pemain + waktu per babak + skor
router.get('/rekap', (req, res) => {
  const { kelas } = req.query;

  let sql = `
    SELECT 
      r.id,
      r.nama,
      r.kelas,
      r.jenisKelamin,
      r.session_id,
      r.created_at,
      MAX(CASE WHEN w.babak = 1 THEN w.waktu_detik END) as waktu_babak1,
      MAX(CASE WHEN w.babak = 2 THEN w.waktu_detik END) as waktu_babak2,
      MAX(CASE WHEN w.babak = 3 THEN w.waktu_detik END) as waktu_babak3,
      MAX(CASE WHEN w.babak = 1 THEN w.skor END) as skor_babak1,
      MAX(CASE WHEN w.babak = 2 THEN w.skor END) as skor_babak2,
      MAX(CASE WHEN w.babak = 3 THEN w.skor END) as skor_babak3,
      COALESCE(SUM(w.skor), 0) as total_skor,
      COALESCE(SUM(w.waktu_detik), 0) as total_waktu
    FROM responden r
    LEFT JOIN waktu_babak w ON r.session_id = w.session_id
  `;

  const params = [];
  if (kelas) {
    sql += ` WHERE r.kelas = ?`;
    params.push(kelas);
  }

  sql += ` GROUP BY r.session_id ORDER BY r.created_at DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error rekap admin:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(rows);
  });
});

// GET /api/admin/kelas -> daftar kelas unik (untuk dropdown filter)
router.get('/kelas', (req, res) => {
  const sql = `SELECT DISTINCT kelas FROM responden ORDER BY kelas ASC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error daftar kelas:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(rows.map(r => r.kelas));
  });
});

module.exports = router;
