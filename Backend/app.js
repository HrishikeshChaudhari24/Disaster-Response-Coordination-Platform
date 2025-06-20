require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const mockAuth = require('./middleware/mockAuth');

// Configure CORS for Express
app.use(cors({
  origin: 'https://disaster-response-coordination.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://disaster-response-coordination.netlify.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mockAuth);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io to use in controllers
app.set('io', io);

// Routes
const disasterRoutes = require('./routes/disasters');
app.use('/disasters', (req, res, next) => {
  req.io = io; // Attach socket to req object
  next();
}, disasterRoutes);

const geocodeRoutes = require('./routes/geocode');
app.use('/geocode', geocodeRoutes);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
