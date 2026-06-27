// server/socket/roomManager.js
// Mengatur "room" (1 room = 1 sesi kelompok 5 player) dan broadcast posisi realtime.
// Soal, nyawa, dan skor TIDAK disinkronkan di sini -- itu logic lokal di tiap client.
// Server cuma jadi "relay" posisi supaya semua orang lihat karakter lain gerak di map yang sama.

function registerRoomHandlers(io) {
  // Struktur in-memory penyimpanan room aktif.
  // Untuk versi production sederhana, in-memory cukup -- room hilang kalau server restart,
  // tapi data hasil jawaban tetap aman karena itu sudah dikirim ke database lewat API terpisah.
  const rooms = {};
  // rooms[roomId] = { players: { socketId: { col, row, name, color } } }

  io.on("connection", (socket) => {
    console.log("Client connect:", socket.id);

    socket.on("join_room", ({ roomId, name, characterId, babak }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.name = name;

      if (!rooms[roomId]) {
        rooms[roomId] = { players: {} };
      }

      // posisi awal default, nanti diupdate begitu client kirim "move"
      rooms[roomId].players[socket.id] = {
        col: -1,
        row: -1,
        name: name || "Player",
        characterId: characterId || "cat",
        color: pickColor(Object.keys(rooms[roomId].players).length),
        babak: babak || 1,
      };

      // kirim daftar player yang sudah ada ke client yang baru join
      socket.emit("room_state", rooms[roomId].players);

      // kasih tau player lain ada yang baru gabung
      socket.to(roomId).emit("player_joined", {
        id: socket.id,
        ...rooms[roomId].players[socket.id],
      });
    });

    socket.on('move', ({ col, row, facing, babak }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !rooms[roomId]) return;

      rooms[roomId].players[socket.id].col = col;
      rooms[roomId].players[socket.id].row = row;
      if (facing) rooms[roomId].players[socket.id].facing = facing;
      if (babak !== undefined) rooms[roomId].players[socket.id].babak = babak;

      // broadcast posisi terbaru ke semua player lain di room yang sama
      socket.to(roomId).emit('player_moved', {
        id: socket.id,
        col,
        row,
        facing,
        babak: rooms[roomId].players[socket.id].babak
      });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (roomId && rooms[roomId]) {
        delete rooms[roomId].players[socket.id];
        socket.to(roomId).emit("player_left", { id: socket.id });

        // bersihkan room kalau sudah kosong
        if (Object.keys(rooms[roomId].players).length === 0) {
          delete rooms[roomId];
        }
      }
      console.log("Client disconnect:", socket.id);
    });
  });
}

function pickColor(index) {
  const palette = ["#d9534f", "#3f9d8f", "#4a90d9", "#e08a3c", "#8fd93f"];
  return palette[index % palette.length];
}

module.exports = registerRoomHandlers;
