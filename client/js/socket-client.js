// client/js/socket-client.js
// Inisialisasi koneksi Socket.io dan hubungkan event ke PlayerModule.

window.SocketClient = (function () {
  const socket = io(); // otomatis connect ke server yang sama (host:port)

  const roomId = sessionStorage.getItem("revoice_roomId") || "default-room";
  const nama = sessionStorage.getItem("revoice_nama") || "Player";
  const characterId = sessionStorage.getItem("revoice_characterId") || "cat";

  socket.on("connect", function () {
    console.log("Terhubung ke server, id:", socket.id);
    socket.emit("join_room", { roomId, name: nama, characterId });
  });

  // server kirim daftar player yang sudah ada di room saat kita baru join
  socket.on("room_state", function (players) {
    window.PlayerModule.setRoomState(players);
  });

  // ada player baru yang join setelah kita
  socket.on("player_joined", function (data) {
    window.PlayerModule.addRemotePlayer(data.id, data);
  });

  // player lain bergerak
  socket.on('player_moved', function (data) {
    window.PlayerModule.updateRemotePlayer(data.id, data.col, data.row, data.facing);
  });

  // player lain keluar
  socket.on("player_left", function (data) {
    window.PlayerModule.removeRemotePlayer(data.id);
  });

  function sendMove(col, row, facing) {
    socket.emit('move', { col, row, facing });
  }

  return { socket, sendMove };
})();
