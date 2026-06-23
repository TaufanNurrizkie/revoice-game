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
