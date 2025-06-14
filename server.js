const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.json({ fileUrl: `/uploads/${req.file.filename}`, originalName: req.file.originalname });
});

io.on('connection', (socket) => {
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  console.log('User connected:', ip);

  socket.on('chat message', (msg) => {
    const timestamp = new Date().toLocaleString();
    io.emit('chat message', {
      text: msg.text,
      time: timestamp,
      ip: ip,
      fileUrl: msg.fileUrl || null,
      fileName: msg.fileName || null
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', ip);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
