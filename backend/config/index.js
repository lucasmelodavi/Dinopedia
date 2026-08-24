const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'Code42507',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    publicUrl:
        process.env.PUBLIC_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        'http://localhost:3000',
    databaseUrl:
        process.env.DATABASE_URL ||
        'postgres://dinopedia:dinopedia@localhost:55432/dinopedia',
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    emailCriador: 'lucasmelodavi425@gmail.com'
};
    databaseUrl:
        process.env.DATABASE_URL ||
        'postgres://dinopedia:dinopedia@localhost:55432/dinopedia',
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    emailCriador: 'lucasmelodavi425@gmail.com'
};

module.exports = config;