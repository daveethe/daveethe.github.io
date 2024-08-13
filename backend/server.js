const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importa CORS
const dotenv = require('dotenv');
const vacationRoutes = require('./routes/vacations');

dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Abilita CORS su tutte le rotte
app.use(express.json());

// Rotte
app.use('/api/vacations', vacationRoutes);

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Avvio del server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

