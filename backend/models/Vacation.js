const mongoose = require('mongoose');

// Definisci lo schema per i voli
const flightSchema = new mongoose.Schema({
    airline: String,
    flightNumber: String,
    departureTime: Date,
    arrivalTime: Date,
});

// Definisci lo schema per gli hotel
const hotelSchema = new mongoose.Schema({
    name: String,
    address: String,
    checkInDate: Date,
    checkOutDate: Date,
});

// Definisci lo schema per l'itinerario
const itinerarySchema = new mongoose.Schema({
    date: Date,
    activities: [String],
});

// Aggiorna lo schema delle vacanze per includere voli, hotel e itinerario
const VacationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    flights: [flightSchema],  // Array di oggetti volo
    hotels: [hotelSchema],    // Array di oggetti hotel
    itinerary: [itinerarySchema], // Array di oggetti itinerario
});

module.exports = mongoose.model('Vacation', VacationSchema);
