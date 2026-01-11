// ===== SERVER.JS - Main Express server =====

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
    credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ===== ROUTES =====

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Prive Note+ API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
    const connected = await testConnection();
    res.json({
        database: connected ? 'Connected' : 'Failed',
        timestamp: new Date().toISOString()
    });
});

// TODO: Add API routes here
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/notes', require('./routes/notes'));

// ===== ERROR HANDLING =====

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===== START SERVER =====

async function startServer() {
    try {
        // Test database connection first
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('⚠️  Starting server without database connection');
        }

        // Start listening
        app.listen(PORT, () => {
            console.log('\n🚀 Prive Note+ Backend Server');
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Server running on: http://localhost:${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/api/health`);
            console.log(`   Database test: http://localhost:${PORT}/api/test-db\n`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server gracefully...');
    process.exit(0);
});

// Start the server
startServer();
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const notesRoutes = require('./routes/notes');
app.use('/api/notes', notesRoutes);
