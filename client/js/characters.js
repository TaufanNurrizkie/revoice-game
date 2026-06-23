// client/js/characters.js
// Daftar karakter yang bisa dipilih player sebelum masuk game.
// Untuk menambah karakter baru: tinggal tambahkan 1 entri di array CHARACTERS,
// lalu taruh file sprite-nya di client/assets/sprites/ dengan format yang sama
// seperti yang sudah ada (grid 4 kolom x 3 baris, 64x64px per frame -- lihat
// player.js untuk detail layout FRAMES).

window.CHARACTERS = [
  { id: "cat", nama: "Kucing", sprite: "assets/sprites/cat-player.png" },
  { id: "frog", nama: "Kodok", sprite: "assets/sprites/frog-player.png" },
  { id: "cow", nama: "Sapi", sprite: "assets/sprites/cow-player.png" },
  { id: "shiba", nama: "Shiba", sprite: "assets/sprites/shiba-player.png" },
];

window.getCharacterById = function (id) {
  return (
    window.CHARACTERS.find(function (c) {
      return c.id === id;
    }) || window.CHARACTERS[0]
  );
};
