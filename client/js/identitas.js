// client/js/identitas.js
// Submit form identitas responden, simpan sessionId + roomId ke sessionStorage,
// lalu pindah ke halaman pilih karakter (sebelum masuk game).

document
  .getElementById("form-responden")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const kelas = document.getElementById("kelas").value.trim();
    const jenisKelamin = document.getElementById("jenisKelamin").value;
    const roomId = document.getElementById("roomId").value.trim();

    try {
      const res = await fetch("/api/responden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, kelas, jenisKelamin }),
      });
      const data = await res.json();

      // simpan data sesi di sessionStorage supaya bisa dipakai di halaman berikutnya
      sessionStorage.setItem("revoice_nama", nama);
      sessionStorage.setItem("revoice_sessionId", data.sessionId);
      sessionStorage.setItem("revoice_roomId", roomId);

      window.location.href = "pilih-karakter.html";
    } catch (err) {
      alert("Gagal menyimpan data, coba lagi. (" + err.message + ")");
    }
  });

// Fetch and display mini leaderboard
async function loadMiniLeaderboard() {
  const container = document.getElementById("index-lb-content");
  try {
    const res = await fetch("/api/responden/leaderboard");
    const data = await res.json();

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="index-lb-empty">Belum ada data pemain.</div>';
      return;
    }

    // Limit to top 7
    const topData = data.slice(0, 7);
    let html = '';

    topData.forEach((player, index) => {
      html += `
        <div class="index-lb-item">
          <div class="index-lb-rank">#${index + 1}</div>
          <div class="index-lb-info">
            <div class="index-lb-name">${player.nama}</div>
            <div class="index-lb-kelas">Kelas: ${player.kelas}</div>
          </div>
          <div class="index-lb-stats">
            <div class="index-lb-score">⭐ ${player.total_skor}</div>
            <div class="index-lb-time">⏱️ ${player.total_waktu}s</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error("Gagal load leaderboard:", err);
    container.innerHTML = '<div class="index-lb-empty">Gagal memuat leaderboard.</div>';
  }
}

// Load on page load
loadMiniLeaderboard();
