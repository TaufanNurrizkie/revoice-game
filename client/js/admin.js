document.addEventListener('DOMContentLoaded', () => {
  const kelasFilter = document.getElementById('kelas-filter');
  const tableBody = document.getElementById('table-body');
  const btnExport = document.getElementById('btn-export');

  // Load dropdown kelas
  fetch('/api/admin/kelas')
    .then(res => res.json())
    .then(data => {
      if (data && data.kelas) {
        data.kelas.forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k;
          kelasFilter.appendChild(opt);
        });
      }
    })
    .catch(err => console.error('Error fetching kelas:', err));

  // Load data based on filter
  function loadData(kelas = '') {
    tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Memuat data...</td></tr>';
    const url = kelas ? `/api/admin/rekap?kelas=${encodeURIComponent(kelas)}` : '/api/admin/rekap';
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        tableBody.innerHTML = '';
        if (data && data.length > 0) {
          data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${item.nama || '-'}</td>
              <td>${item.kelas || '-'}</td>
              <td>${item.waktu_babak1 || 0}s</td>
              <td>${item.skor_babak1 || 0}</td>
              <td>${item.waktu_babak2 || 0}s</td>
              <td>${item.skor_babak2 || 0}</td>
              <td>${item.waktu_babak3 || 0}s</td>
              <td>${item.skor_babak3 || 0}</td>
              <td>${item.total_waktu || 0}s</td>
              <td class="highlight-score">${item.total_skor || 0}</td>
            `;
            tableBody.appendChild(tr);
          });
        } else {
          tableBody.innerHTML = '<tr><td colspan="10" class="text-center">Tidak ada data.</td></tr>';
        }
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-error">Gagal memuat data.</td></tr>';
      });
  }

  // Initial load
  loadData();

  // Filter change
  kelasFilter.addEventListener('change', (e) => {
    loadData(e.target.value);
  });

  // Export
  btnExport.addEventListener('click', () => {
    window.location.href = '/api/export';
  });
});
