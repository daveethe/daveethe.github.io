const express = require('express');
const router = express.Router();
const Vacation = require('../models/Vacation');

// Recupera i dettagli di una singola vacanza
router.get('/:id', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.id);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }
        res.json(vacation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Recupera tutte le vacanze
router.get('/', async (req, res) => {
    try {
        const vacations = await Vacation.find();
        res.json(vacations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// Aggiorna una vacanza esistente
router.put('/:id', async (req, res) => {
    try {
        const updatedVacation = await Vacation.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
            },
            { new: true }
        );

        if (!updatedVacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }

        res.json(updatedVacation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancella una vacanza
router.delete('/:id', async (req, res) => {
    try {
        const vacation = await Vacation.findByIdAndDelete(req.params.id);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }
        res.json({ message: 'Vacation deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Aggiungi un volo a una vacanza
router.post('/:vacationId/flights', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }
        vacation.flights.push(req.body);
        await vacation.save();
        res.status(201).json(vacation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Aggiorna un volo esistente
router.put('/:vacationId/flights/:flightId', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }

        const flight = vacation.flights.id(req.params.flightId);
        if (!flight) {
            return res.status(404).json({ error: 'Flight not found' });
        }

        flight.airline = req.body.airline;
        flight.flightNumber = req.body.flightNumber;
        flight.departureTime = req.body.departureTime;
        flight.arrivalTime = req.body.arrivalTime;

        await vacation.save();
        res.status(200).json(vacation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Elimina un volo esistente
router.delete('/:vacationId/flights/:flightId', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }

        const flight = vacation.flights.id(req.params.flightId);
        if (!flight) {
            return res.status(404).json({ error: 'Flight not found' });
        }

        vacation.flights.pull(req.params.flightId);  // Usa .pull() per rimuovere il subdocumento

        await vacation.save();  // Salva le modifiche nel database
        res.status(200).json(vacation);
    } catch (err) {
        console.error(err);  // Log dell'errore per debug
        res.status(500).json({ error: 'Errore durante l\'eliminazione del volo' });
    }
});

// Aggiungi un hotel a una vacanza
router.post('/:vacationId/hotels', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }
        vacation.hotels.push(req.body);
        await vacation.save();
        res.status(201).json(vacation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Aggiorna un hotel esistente
router.put('/:vacationId/hotels/:hotelId', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }

        const hotel = vacation.hotels.id(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }

        hotel.name = req.body.name;
        hotel.address = req.body.address;
        hotel.checkInDate = req.body.checkInDate;
        hotel.checkOutDate = req.body.checkOutDate;

        await vacation.save();
        res.status(200).json(vacation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Elimina un hotel esistente
router.delete('/:vacationId/hotels/:hotelId', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }

        // Utilizza il metodo pull per rimuovere l'hotel dall'array
        const hotel = vacation.hotels.id(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({ error: 'Hotel not found' });
        }

        vacation.hotels.pull(req.params.hotelId);  // Usa .pull() per rimuovere il subdocumento

        await vacation.save();  // Salva le modifiche nel database
        res.status(200).json(vacation);
    } catch (err) {
        console.error(err);  // Log dell'errore per debug
        res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'hotel' });
    }
});

// Aggiungi un itinerario a una vacanza
router.post('/:vacationId/itinerary', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }
        vacation.itinerary.push(req.body);
        await vacation.save();
        res.status(201).json(vacation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Aggiorna un itinerario esistente
router.put('/:vacationId/itinerary/:itineraryId', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }

        const itinerary = vacation.itinerary.id(req.params.itineraryId);
        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }

        itinerary.date = req.body.date;
        itinerary.activities = req.body.activities;

        await vacation.save();
        res.status(200).json(vacation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Elimina un itinerario esistente
router.delete('/:vacationId/itinerary/:itineraryId', async (req, res) => {
    try {
        const vacation = await Vacation.findById(req.params.vacationId);
        if (!vacation) {
            return res.status(404).json({ error: 'Vacation not found' });
        }

        const itinerary = vacation.itinerary.id(req.params.itineraryId);
        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }

        vacation.itinerary.pull(req.params.itineraryId);  // Usa .pull() per rimuovere il subdocumento

        await vacation.save();  // Salva le modifiche nel database
        res.status(200).json(vacation);
    } catch (err) {
        console.error(err);  // Log dell'errore per debug
        res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'itinerario' });
    }
});

module.exports = router;
