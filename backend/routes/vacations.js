const express = require('express');
const router = express.Router();
const Vacation = require('../models/Vacation');

// Crea una nuova vacanza
router.post('/', async (req, res) => {
    try {
        const vacation = new Vacation(req.body);
        await vacation.save();
        res.status(201).json(vacation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Ottieni tutte le vacanze
router.get('/', async (req, res) => {
    try {
        const vacations = await Vacation.find();
        res.json(vacations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Modifica una vacanza
router.put('/:id', async (req, res) => {
    try {
        const vacation = await Vacation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(vacation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Cancella una vacanza
router.delete('/:id', async (req, res) => {
    try {
        await Vacation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Vacation deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
