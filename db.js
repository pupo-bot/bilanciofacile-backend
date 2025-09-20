import pg from 'pg';

// Crea un nuovo client per il database.
// Si connetterà automaticamente usando l'URL che imposteremo su Render.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Funzione per assicurarsi che la nostra tabella 'users' esista.
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);
    console.log("Tabella 'users' verificata o creata con successo.");
  } catch (err) {
    console.error("Errore durante l'inizializzazione del database:", err);
  } finally {
    client.release();
  }
};

// Esportiamo sia il 'pool' (per fare le query) sia la funzione di inizializzazione.
export { pool, initializeDatabase };
