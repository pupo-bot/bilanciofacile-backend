// --- Importazione dei moduli necessari ---
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

// --- Configurazione del Server ---
const app = express();

// --- Configurazione CORS Specifica ---
const corsOptions = {
  origin: function (origin, callback) {
    console.log('Richiesta in arrivo da origin:', origin);
    const whitelist = ['https://codepen.io'];
    // Nota: Ho rimosso l'URL di Replit e lasciato solo StackBlitz come riferimento
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
  response.send("Backend BilancioFacile Attivo!");
});

// --- API DI AUTENTICAZIONE ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono obbligatori.' });
    }
    await db.read();
    const existingUser = db.data.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ message: 'Un utente con questa email esiste già.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      password: hashedPassword,
      role: 'owner',
    };
    db.data.users.push(newUser);
    await db.write();
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
    await db.read();
    const user = db.data.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET, // Render userà questa variabile d'ambiente
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
