// server/routes/export.js
// API untuk export hasil rekaman waktu babak ke file Excel (.xlsx)
const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const db = require('../db/database');

router.get('/', async (req, res) => {
  // Query waktu per babak (hanya identitas dan waktu saja sesuai request user)
  const sqlWaktu = `
    SELECT 
      r.nama, r.kelas, r.session_id,
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
    GROUP BY r.session_id
    ORDER BY r.created_at ASC
  `;

  db.all(sqlWaktu, [], async (err, waktuRows) => {
    if (err) {
      console.error('Error saat export waktu:', err.message);
      return res.status(500).send('Terjadi kesalahan saat export data');
    }

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Rekap Waktu (hanya identitas dan waktu/skor)
    const sheetWaktu = workbook.addWorksheet('Rekap Waktu');
    sheetWaktu.columns = [
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Kelas', key: 'kelas', width: 10 },
      { header: 'Waktu B1 (detik)', key: 'waktu_babak1', width: 16 },
      { header: 'Skor B1', key: 'skor_babak1', width: 10 },
      { header: 'Waktu B2 (detik)', key: 'waktu_babak2', width: 16 },
      { header: 'Skor B2', key: 'skor_babak2', width: 10 },
      { header: 'Waktu B3 (detik)', key: 'waktu_babak3', width: 16 },
      { header: 'Skor B3', key: 'skor_babak3', width: 10 },
      { header: 'Total Waktu (detik)', key: 'total_waktu', width: 18 },
      { header: 'Total Skor', key: 'total_skor', width: 12 }
    ];

    waktuRows.forEach(row => {
      sheetWaktu.addRow({
        nama: row.nama,
        kelas: row.kelas,
        waktu_babak1: row.waktu_babak1 || '-',
        skor_babak1: row.skor_babak1 || 0,
        waktu_babak2: row.waktu_babak2 || '-',
        skor_babak2: row.skor_babak2 || 0,
        waktu_babak3: row.waktu_babak3 || '-',
        skor_babak3: row.skor_babak3 || 0,
        total_waktu: row.total_waktu,
        total_skor: row.total_skor
      });
    });

    // Style header row
    sheetWaktu.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3A5A45' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=hasil-revoice.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  });
});

module.exports = router;
