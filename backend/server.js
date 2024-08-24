const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Importa il file delle rotte delle vacanze
const vacationRoutes = require('./routes/vacations');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configura le rotte
app.use('/api/vacations', vacationRoutes);

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Avvio del server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


