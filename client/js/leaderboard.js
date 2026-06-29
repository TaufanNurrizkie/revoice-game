document.addEventListener('DOMContentLoaded', () => {
  const podiumContainer = document.getElementById('podium-container');
  const lbTableBody = document.getElementById('lb-table-body');

  fetch('/api/responden/leaderboard')
    .then(res => res.json())
    .then(data => {
      podiumContainer.innerHTML = '';
      lbTableBody.innerHTML = '';

      if (!data || data.length === 0) {
        lbTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data.</td></tr>';
        return;
      }

      // Sort data: highest score first, then fastest total_waktu
      const sortedData = data.sort((a, b) => {
        if (b.total_skor !== a.total_skor) {
          return b.total_skor - a.total_skor;
        }
        return a.total_waktu - b.total_waktu;
      });

      const top3 = sortedData.slice(0, 3);
      const rest = sortedData.slice(3);

      // Render Podium
      // Top 3 logical order for UI: 2nd, 1st, 3rd
      const podiumOrder = [
        { rank: 2, data: top3[1] },
        { rank: 1, data: top3[0] },
        { rank: 3, data: top3[2] }
      ];

      podiumOrder.forEach(item => {
        if (item.data) {
          // Karena karakter_id tidak disimpan di DB saat ini, gunakan default sprite
          const charThumb = 'assets/sprites/cat-player.png';
          const podiumEl = document.createElement('div');
          podiumEl.className = `podium-spot rank-${item.rank}`;
          podiumEl.innerHTML = `
            <div class="podium-avatar">
              <img src="${charThumb}" alt="Avatar">
            </div>
            <div class="podium-name">${item.data.nama}</div>
            <div class="podium-score">${item.data.total_skor} PTS</div>
            <div class="podium-time">${item.data.total_waktu}s</div>
            <div class="podium-block">
              <div class="rank-number">${item.rank}</div>
            </div>
          `;
          podiumContainer.appendChild(podiumEl);
        } else {
          // Empty spot
          const podiumEl = document.createElement('div');
          podiumEl.className = `podium-spot rank-${item.rank} empty-spot`;
          podiumEl.innerHTML = `
            <div class="podium-block">
              <div class="rank-number">${item.rank}</div>
            </div>
          `;
          podiumContainer.appendChild(podiumEl);
        }
      });

      // Render rest of the players
      if (rest.length > 0) {
        rest.forEach((player, index) => {
          const rank = index + 4;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-center font-bold">#${rank}</td>
            <td>${player.nama}</td>
            <td>${player.kelas}</td>
            <td>${player.total_waktu}s</td>
            <td class="highlight-score">${player.total_skor}</td>
          `;
          lbTableBody.appendChild(tr);
        });
      } else {
        // If there are no players outside top 3, do not show "Belum ada data" if top 3 exists
        if (data.length <= 3) {
          lbTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-dim">Tidak ada data lainnya.</td></tr>';
        }
      }
    })
    .catch(err => {
      console.error('Error fetching leaderboard:', err);
      lbTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-error">Gagal memuat leaderboard.</td></tr>';
    });
});
