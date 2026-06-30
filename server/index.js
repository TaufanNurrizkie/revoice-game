// server/index.js
// Entry point server. Menjalankan Express (serve client + API) dan Socket.io (multiplayer realtime).

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const respondenRoutes = require('./routes/responden');
const exportRoutes = require('./routes/export');
const adminRoutes = require('./routes/admin');
const registerRoomHandlers = require('./socket/roomManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // longgarkan dulu untuk development, perketat saat production
});

const PORT = process.env.PORT || 3003;

app.use(express.json());

// Serve semua file di folder client sebagai static (HTML, CSS, JS, assets)
app.use(express.static(path.join(__dirname, '..', 'client')));

// API routes
app.use('/api/responden', respondenRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io: semua logic room & broadcast posisi ada di roomManager.js
registerRoomHandlers(io);

server.listen(PORT, () => {
  console.log(`RE:VOICE server jalan di http://localhost:${PORT}`);
});
