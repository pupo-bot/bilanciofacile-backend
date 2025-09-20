// --- Importazione dei moduli necessari ---
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Importiamo dal nostro nuovo db.js
import { pool, initializeDatabase } from './db.js';

// --- Inizializza il Database ---
// Ci assicuriamo che la tabella 'users' esista prima di avviare il server.
await initializeDatabase();

// --- Configurazione del Server ---
const app = express();
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || (origin && origin.endsWith('.stackblitz.io'))) {
      callback(null, true);
    } else {
      callback(new Error('Bloccato dalla policy CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// --- API Endpoint di Prova ---
app.get("/", (request, response) => {
  response.send("Backend BilancioFacile Attivo e Connesso a PostgreSQL!");
});

// --- API DI AUTENTICAZIONE (RISCRITTE PER SQL) ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono obbligatori.' });
    }

    // Controlla se l'utente esiste già con una query SQL
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Un utente con questa email esiste già.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      password: hashedPassword,
      role: 'owner',
    };

    // Inserisce il nuovo utente nel database
    await pool.query(
      "INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)",
      [newUser.id, newUser.email, newUser.password, newUser.role]
    );

    console.log(`Nuovo utente registrato: ${email}`);
    res.status(201).json({ message: 'Utente registrato con successo!' });
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    res.status(500).json({ message: 'Errore interno del server.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono obbligatori.' });
    }

    // Cerca l'utente nel database
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Utente ${email} ha effettuato il login.`);
    res.status(200).json({ token, role: user.role });
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.status(500).json({ message: 'Errore interno del server.' });
  }
});

// --- Avvio del Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Il tuo server è in ascolto sulla porta ${PORT}`);
});
