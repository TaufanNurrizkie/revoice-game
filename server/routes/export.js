// server/routes/export.js
// API untuk export hasil rekaman jawaban + latency ke file Excel (.xlsx)
const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const db = require('../db/database');

router.get('/', async (req, res) => {
  const sql = `
    SELECT 
      r.nama, r.kelas, 
      j.babak, j.soal, j.jawaban, j.benar, j.latency_ms as latency
    FROM responden r
    JOIN jawaban j ON r.session_id = j.session_id
    ORDER BY j.created_at ASC
  `;

  db.all(sql, [], async (err, rows) => {
    if (err) {
      console.error('Error saat export data:', err.message);
      return res.status(500).send('Terjadi kesalahan saat export data');
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Hasil RE:VOICE');

    sheet.columns = [
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Kelas', key: 'kelas', width: 10 },
      { header: 'Babak', key: 'babak', width: 10 },
      { header: 'Soal', key: 'soal', width: 30 },
      { header: 'Jawaban', key: 'jawaban', width: 25 },
      { header: 'Benar', key: 'benar', width: 10 },
      { header: 'Latency (ms)', key: 'latency', width: 14 }
    ];

    rows.forEach(row => {
      sheet.addRow({
        nama: row.nama,
        kelas: row.kelas,
        babak: row.babak,
        soal: row.soal,
        jawaban: row.jawaban,
        benar: row.benar ? 'Ya' : 'Tidak',
        latency: row.latency
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=hasil-revoice.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  });
});

module.exports = router;
