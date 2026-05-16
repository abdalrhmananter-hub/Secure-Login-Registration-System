

const sql = require('mssql');


const config = {
  user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    port: parseInt(process.env.DB_PORT), 
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, 
        trustServerCertificate: true
    }
};


let pool = null;


async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log(' Connected to SQL Server');

    
    await pool.request().query(`
      -- Users table: stores registered accounts
      IF NOT EXISTS (
        SELECT * FROM sysobjects WHERE name='users' AND xtype='U'
      )
      CREATE TABLE users (
        id          INT IDENTITY(1,1) PRIMARY KEY,  -- auto-increment PK
        username    NVARCHAR(50)  NOT NULL UNIQUE,   -- must be unique
        email       NVARCHAR(100) NOT NULL UNIQUE,   -- must be unique
        password    NVARCHAR(255) NOT NULL,          -- bcrypt hash (never plain text!)
        created_at  DATETIME DEFAULT GETDATE()       -- timestamp
      );
    `);

    console.log(' Database schema ready');
    return pool;
  } catch (err) {
    console.error(' Database connection failed:', err.message);
    process.exit(1); // stop the app – no DB means nothing works
  }
}


function getPool() {
  if (!pool) throw new Error('Database not initialised – call connectDB() first');
  return pool;
}

module.exports = { connectDB, getPool, sql };
