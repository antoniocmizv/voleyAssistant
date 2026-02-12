require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const playersRoutes = require('./routes/players');
const trainingsRoutes = require('./routes/trainings');
const attendanceRoutes = require('./routes/attendance');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');

// Inicializar base de datos
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializar y arrancar
const startServer = async () => {
  try {
    await initDatabase();
    console.log('✅ Base de datos inicializada');

    app.listen(PORT, () => {
      console.log(`🏐 VoleyAssistant API corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
