let currentVacation = null; // Definizione globale
let map; // Variabile globale per la mappa
let manualMarkers = [];  // Variabile per salvare i marker aggiunti dall'utente


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const vacationId = urlParams.get('id');

    if (!vacationId) {
        alert('No vacation selected');
        window.location.href = 'index.html'; // Ritorna alla homepage se non c'è ID
        return;
    }

    // Recupera i dettagli della vacanza dal server
    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}`);
        if (!response.ok) {
            throw new Error('Errore nel recuperare i dettagli della vacanza');
        }
        currentVacation = await response.json(); // Assegna il valore a currentVacation
        document.getElementById('vacationName').innerText = currentVacation.name;

        // Carica voli, hotel e itinerari
        loadFlights(currentVacation.flights);
        loadHotels(currentVacation.hotels);
        loadItinerary(currentVacation.itinerary);

        // Ora che currentVacation è impostato, popola il selettore
        const daySelector = document.getElementById('daySelector');
        if (currentVacation.itinerary && daySelector) {
            const uniqueDates = [...new Set(currentVacation.itinerary.map(day => day.date))];
            uniqueDates.forEach((date, index) => {
                const option = document.createElement('option');
                option.value = date;
                option.textContent = `Day ${index + 1}: ${new Date(date).toLocaleDateString()}`;
                daySelector.appendChild(option);
            });
        }

        // Aggiungi il listener per il selettore dei giorni
        document.getElementById('daySelector').addEventListener('change', function(e) {
            const selectedDate = e.target.value;
            addMarkers(map, selectedDate);  // Passa la data selezionata
        });

    } catch (error) {
        console.error('Errore:', error.message);
    }

    // Aggiungi i gestori di eventi per i pulsanti
    document.getElementById('addFlightBtn').addEventListener('click', () => openModal('flightModal', 'add'));
    document.getElementById('addHotelBtn').addEventListener('click', () => openModal('hotelModal', 'add'));
    document.getElementById('addItineraryBtn').addEventListener('click', () => openModal('itineraryModal', 'add'));
    document.getElementById('openMapBtn').addEventListener('click', () => openMapWithZoom());

    // Gestori di eventi per il submit dei moduli
    document.getElementById('flightForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const flightId = document.getElementById('flightId').value;
        if (flightId) {
            await updateFlight(vacationId, flightId);
        } else {
            await saveFlight(vacationId);
        }
        closeModal('flightModal');
    });

    document.getElementById('hotelForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const hotelId = document.getElementById('hotelId').value;
        if (hotelId) {
            await updateHotel(vacationId, hotelId);
        } else {
            await saveHotel(vacationId);
        }
        closeModal('hotelModal');
    });

    document.getElementById('itineraryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const itineraryId = document.getElementById('itineraryId').value;
        if (itineraryId) {
            await updateItinerary(vacationId, itineraryId);
        } else {
            await saveItinerary(vacationId);
        }
        closeModal('itineraryModal');
    });

});

// Icone personalizzate per i marker
const flightIcon = L.icon({
    iconUrl: 'https://i.imgur.com/DWgnf9r.png', // URL dell'icona dell'aereo
    iconSize: [24, 24], // Dimensione dell'icona
    iconAnchor: [12, 24], // Punto di ancoraggio dell'icona
    popupAnchor: [0, -24], // Punto di ancoraggio del popup rispetto all'icona
});

const hotelIcon = L.icon({
    iconUrl: 'https://i.imgur.com/XqkbOmY.png', // URL dell'icona dell'hotel
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20],
});

const itineraryIcon = L.icon({
    iconUrl: 'https://i.imgur.com/Q0gQIPW.png', // URL dell'icona del segnale di posizione
    iconSize: [24, 24], // Dimensione dell'icona
    iconAnchor: [12, 24], // Punto di ancoraggio dell'icona
    popupAnchor: [0, -24], // Punto di ancoraggio del popup rispetto all'icona
});


function loadFlights(flights) {
    const flightList = document.getElementById('flightList');
    flightList.innerHTML = ''; // Pulisce la lista corrente

    flights.forEach((flight, index) => {
        const flightItem = document.createElement('div');
        flightItem.className = 'flight-item';

        // Template aggiornato per il layout dei voli
        flightItem.innerHTML = `
            <div class="flight-header">
                <span><strong>From:</strong> ${flight.departureAirport || 'N/A'}</span><br>
                <span><strong>To:</strong> ${flight.arrivalAirport || 'N/A'}</span>
            </div>
            <div class="flight-content">
                <div class="flight-time">${new Date(flight.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div class="flight-info">
                    <p><strong>${flight.airline}</strong></p>
                    <p>${flight.flightNumber}</p>
                </div>
                <div class="flight-duration">
                    <span>${calculateDuration(flight.departureTime, flight.arrivalTime)}</span>
                </div>
                <div class="flight-time">${new Date(flight.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
            <div class="flight-footer">
                <div class="arrival-date">
                    <span>${new Date(flight.arrivalTime).toLocaleDateString()}</span>
                </div>
                <div class="actions">
                    <button onclick="editFlight('${flight._id}')">✏️</button>
                    <button onclick="deleteFlight('${currentVacation._id}', '${flight._id}')">🗑️</button>
                </div>
            </div>
        `;
        flightList.appendChild(flightItem);
    });
}

function calculateDuration(departureTime, arrivalTime) {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const diff = new Date(arrival - departure);
    const hours = diff.getUTCHours();
    const minutes = diff.getUTCMinutes();
    return `${hours} ore ${minutes} minuti`;
}

function loadHotels(hotels) {
    const hotelList = document.getElementById('hotelList');
    hotelList.innerHTML = ''; // Pulisce la lista corrente

    hotels.forEach(hotel => {
        const hotelItem = document.createElement('div');
        hotelItem.className = 'hotel-item';
        hotelItem.innerHTML = `
            <div class="hotel-content">
                <div class="hotel-info">
                    <p><strong>${hotel.name}</strong></p>
                    <p>${hotel.address}</p>
                </div>
                <div class="hotel-dates">
                    <div><strong>Check-in:</strong> ${new Date(hotel.checkInDate).toLocaleDateString()}</div>
                    <div><strong>Check-out:</strong> ${new Date(hotel.checkOutDate).toLocaleDateString()}</div>
                </div>
                <div class="actions">
                    <button onclick="editHotel('${hotel._id}')">✏️</button>
                    <button onclick="deleteHotel('${currentVacation._id}', '${hotel._id}')">🗑️</button>
                </div>
            </div>
        `;
        hotelList.appendChild(hotelItem);
    });
}

function loadItinerary(itinerary) {
    const itineraryList = document.getElementById('itineraryList');
    itineraryList.innerHTML = ''; // Pulisce la lista corrente

    // Ordina l'itinerario per data e ora (gestisci anche l'orario se presente)
    itinerary.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + (a.time || '00:00')); // Se non c'è un'ora, usa mezzanotte
        const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
        return dateA - dateB; // Ordine crescente
    });

    // Genera l'HTML per ogni giorno dell'itinerario
    itinerary.forEach(day => {
        const itineraryItem = document.createElement('div');
        itineraryItem.className = 'itinerary-item';
        itineraryItem.innerHTML = `
            <div class="itinerary-content">
                <div><strong>Date:</strong> ${new Date(day.date).toLocaleDateString()} <strong>- Time:</strong> ${day.time || ''}</div>
                <ul>
                    ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
                <div>Location: ${day.coordinates ? `<a href="https://www.google.com/maps?q=${day.coordinates.lat},${day.coordinates.lng}" target="_blank">(${day.coordinates.lat}, ${day.coordinates.lng})</a>` : 'N/A'}</div>
                <div class="actions">
                    <button onclick="editItinerary('${day._id}')">✏️</button>
                    <button onclick="deleteItinerary('${currentVacation._id}', '${day._id}')">🗑️</button>
                </div>
            </div>
        `;
        itineraryList.appendChild(itineraryItem);
    });
}

function openModal(modalId, mode, data = {}) {
    const formId = `${modalId.split('Modal')[0]}Form`; // Assicura che l'ID del form sia corretto
    const formElement = document.getElementById(formId);

    // Verifica che il modalId e il formId esistano nel DOM
    if (!formElement && modalId !== 'mapModal') { // Aggiunto per escludere la mappa
        console.error(`Form element with ID ${formId} not found.`);
        return;
    }

    const modalTitleElement = document.getElementById(`${modalId}Title`);
    if (!modalTitleElement && modalId !== 'mapModal') { // Aggiunto per escludere la mappa
        console.error(`Modal title element with ID ${modalId}Title not found.`);
        return;
    }

    if (mode === 'add') {
        modalTitleElement.innerText = `Add ${modalId.split('Modal')[0]}`;
        formElement.reset();
        document.getElementById(`${modalId.split('Modal')[0]}Id`).value = ''; // Clear hidden input for new data
        
        // Aggiungi qui le coordinate se disponibili
        document.getElementById('lat').value = data.lat || ''; // Imposta le coordinate lat
        document.getElementById('lng').value = data.lng || ''; // Imposta le coordinate lng
    } else if (mode === 'edit') {
        modalTitleElement.innerText = `Edit ${modalId.split('Modal')[0]}`;
        Object.keys(data).forEach(key => {
            if (document.getElementById(key)) {
                document.getElementById(key).value = data[key];
            }
        });
        document.getElementById(`${modalId.split('Modal')[0]}Id`).value = data._id; // Set hidden input for editing
    } else if (mode === 'viewMap') { // Aggiunto per la mappa
        initializeMap(); // Inizializza la mappa
    }

    document.getElementById(modalId).style.display = 'block';

    if (modalId === 'mapModal') {
        setTimeout(() => {
            if (map) {
                map.invalidateSize(); // Assicura che le dimensioni della mappa siano corrette dopo il rendering
            }
        }, 100); // Breve ritardo per garantire che il rendering sia completato
    }
}



function updateDaySelector(newDate) {
    const daySelector = document.getElementById('daySelector');

    // Verifica se la data è già nel selettore
    const options = Array.from(daySelector.options);
    const dateAlreadyExists = options.some(option => option.value === newDate);

    // Se la data non esiste, aggiungila
    if (!dateAlreadyExists) {
        const option = document.createElement('option');
        const index = options.length; // Conta quanti giorni ci sono già
        option.value = newDate;
        option.textContent = `Day ${index}: ${new Date(newDate).toLocaleDateString()}`;
        daySelector.appendChild(option);
    }
}

function openMapWithZoom() {
    // Apri il modale della mappa prima di qualsiasi azione
    document.getElementById('mapModal').style.display = 'block';

    // Inizializza la mappa solo se non esiste già
    if (!map) {
        map = L.map('map').setView([0, 0], 2);  // Mappa iniziale (senza zoom, verrà aggiornato dopo)
    }

    // Aggiungi il tile layer alla mappa (OpenStreetMap o qualsiasi altro)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Invalidare le dimensioni della mappa (necessario quando la mappa è in un modale)
    setTimeout(() => {
        map.invalidateSize();  // Assicura che la mappa venga ridimensionata correttamente nel modale
    }, 200);

    // Aggiungi il listener per il clic sulla mappa se non è già presente
    map.on('click', function (e) {
        const { lat, lng } = e.latlng;
        // Apri il modale e passa le coordinate cliccate
        openModal('itineraryModal', 'add', { lat, lng });
    });

    // Aggiungi i marker esistenti per gli altri dati (voli, hotel, itinerari)
    addMarkers(map, 'all');  // Aggiungi tutti i marker come al solito
}



function initializeMap() {
    map = L.map('map').setView([0, 0], 2); // Inizializza la mappa

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    addMarkers(map); // Aggiungi i marker esistenti (voli, hotel, ecc.)

    // Aggiungi un listener per il clic sulla mappa per aggiungere marker manuali
    map.on('click', function (e) {
        const { lat, lng } = e.latlng;
        const marker = L.marker([lat, lng], { icon: itineraryIcon }) // Usa l'icona del segnale di posizione
            .addTo(map)
            .bindPopup(`<b>New Marker</b><br>Lat: ${lat}, Lng: ${lng}`);

        manualMarkers.push(marker);  // Salva il marker aggiunto manualmente
        openModal('itineraryModal', 'add', { lat, lng });
    });
}


function addMarkers(map, selectedDate = 'all') {
    if (currentVacation) {
        const bounds = L.latLngBounds();  // Crea i confini da espandere per includere tutti i marker

        // Rimuovi solo i marker che non sono stati aggiunti manualmente
        map.eachLayer(layer => {
            if (layer instanceof L.Marker && !manualMarkers.includes(layer)) {
                map.removeLayer(layer);
            }
        });

        // Aggiungi marker per i voli (partenza e arrivo)
        currentVacation.flights.forEach(flight => {
            getCoordinates(flight.departureAirport).then(coords => {
                if (coords) {
                    const marker = L.marker(coords, { icon: flightIcon })
                        .addTo(map)
                        .bindPopup(`<b>Departure from ${flight.departureAirport}</b>`);
                    bounds.extend(coords);  // Aggiungi il marker ai confini
                }
            });

            getCoordinates(flight.arrivalAirport).then(coords => {
                if (coords) {
                    const marker = L.marker(coords, { icon: flightIcon })
                        .addTo(map)
                        .bindPopup(`<b>Arrival at ${flight.arrivalAirport}</b>`);
                    bounds.extend(coords);  // Aggiungi il marker ai confini
                }
            });
        });

        // Aggiungi marker per gli hotel
        currentVacation.hotels.forEach(hotel => {
            getCoordinates(hotel.address).then(coords => {
                if (coords) {
                    const marker = L.marker(coords, { icon: hotelIcon })
                        .addTo(map)
                        .bindPopup(`<b>${hotel.name}</b><br>${hotel.address}`);
                    bounds.extend(coords);  // Aggiungi il marker ai confini
                }
            });
        });

        // Aggiungi marker e linee per l'itinerario in base alla data selezionata
        currentVacation.itinerary.forEach((day, index) => {
            if (day.coordinates && (selectedDate === 'all' || selectedDate === day.date)) {
                const { lat, lng } = day.coordinates;
                const numberIcon = L.divIcon({
                    html: `<div style="position: relative;">
                                <img src="https://i.imgur.com/Q0gQIPW.png" style="width: 24px; height: 24px;" />
                                <span style="position: absolute; top: -8px; left: 16px; font-size: 12px; color: black; background-color: white; padding: 2px; border-radius: 50%;">${index + 1}</span>
                            </div>`,
                    iconSize: [24, 24],
                    className: ''  // Remove default Leaflet styling
                });

                // Aggiungi il marker con il pop-up contenente attività e orario
                L.marker([lat, lng], { icon: numberIcon })
                    .addTo(map)
                    .bindPopup(`
                        <b>${day.activities.join(', ')}</b><br>
                        <div>Time: ${day.time ? day.time : 'N/A'}</div>
                    `);
                bounds.extend([lat, lng]);  // Aggiungi il marker ai confini
            }
        });

        // Applica i confini (bounds) alla mappa dopo che tutti i marker sono stati aggiunti
        map.fitBounds(bounds);
    }
}

async function getCoordinates(address) {
    try {
        console.log(`Fetching coordinates for: ${address}`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            console.log(`Coordinates found: ${data[0].lat}, ${data[0].lon}`);
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } else {
            console.warn(`No coordinates found for: ${address}`);
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
    }
    return null;
}


function editFlight(flightId) {
    const flight = currentVacation.flights.find(f => f._id === flightId);
    if (flight) {
        openModal('flightModal', 'edit', flight);
    } else {
        console.error('Flight not found.');
    }
}

function editHotel(hotelId) {
    const hotel = currentVacation.hotels.find(h => h._id === hotelId);
    if (hotel) {
        openModal('hotelModal', 'edit', hotel);
    } else {
        console.error('Hotel not found.');
    }
}

function editItinerary(itineraryId) {
    const itinerary = currentVacation.itinerary.find(i => i._id === itineraryId);
    if (itinerary) {
        openModal('itineraryModal', 'edit', itinerary);
        // Aggiungi questo per popolare il campo time
        if (itinerary.time) {
            document.getElementById('itineraryTime').value = itinerary.time;
        }
    } else {
        console.error('Itinerary not found.');
    }
}


async function saveFlight(vacationId) {
    const flightData = {
        airline: document.getElementById('airline').value,
        flightNumber: document.getElementById('flightNumber').value,
        departureAirport: document.getElementById('departureAirport').value.trim(),
        arrivalAirport: document.getElementById('arrivalAirport').value.trim(),
        departureTime: document.getElementById('departureTime').value,
        arrivalTime: document.getElementById('arrivalTime').value
    };

    console.log('Saving flight with data:', flightData);  // Debugging

    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/flights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(flightData),
        });

        if (!response.ok) {
            throw new Error('Errore durante il salvataggio del volo');
        }

        const updatedVacation = await response.json();
        currentVacation = updatedVacation;
        loadFlights(updatedVacation.flights);
    } catch (error) {
        console.error('Errore nel salvataggio del volo:', error.message);
    }
}

async function updateFlight(vacationId, flightId) {
    const flightData = {
        airline: document.getElementById('airline').value,
        flightNumber: document.getElementById('flightNumber').value,
        departureAirport: document.getElementById('departureAirport').value.trim(),
        arrivalAirport: document.getElementById('arrivalAirport').value.trim(),
        departureTime: document.getElementById('departureTime').value,
        arrivalTime: document.getElementById('arrivalTime').value
    };

    console.log('Updating flight with data:', flightData);  // Debugging

    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/flights/${flightId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(flightData),
        });

        if (!response.ok) {
            throw new Error('Errore durante l\'aggiornamento del volo');
        }

        const updatedVacation = await response.json();
        currentVacation = updatedVacation;
        loadFlights(updatedVacation.flights);
    } catch (error) {
        console.error('Errore nell\'aggiornamento del volo:', error.message);
    }
}

async function deleteFlight(vacationId, flightId) {
    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/flights/${flightId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Errore durante l\'eliminazione del volo');
        }

        const updatedVacation = await response.json();
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
        loadFlights(updatedVacation.flights);
    } catch (error) {
        console.error('Errore nell\'eliminazione del volo:', error.message);
    }
}

async function saveHotel(vacationId) {
    const hotelData = {
        name: document.getElementById('hotelName').value,
        address: document.getElementById('address').value,
        checkInDate: document.getElementById('checkInDate').value,
        checkOutDate: document.getElementById('checkOutDate').value
    };

    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/hotels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(hotelData),
        });

        if (!response.ok) {
            throw new Error('Errore durante il salvataggio dell\'hotel');
        }

        const updatedVacation = await response.json();
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
        loadHotels(updatedVacation.hotels);
    } catch (error) {
        console.error('Errore nel salvataggio dell\'hotel:', error.message);
    }
}

async function updateHotel(vacationId, hotelId) {
    const hotelData = {
        name: document.getElementById('hotelName').value,
        address: document.getElementById('address').value,
        checkInDate: document.getElementById('checkInDate').value,
        checkOutDate: document.getElementById('checkOutDate').value
    };

    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/hotels/${hotelId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(hotelData),
        });

        if (!response.ok) {
            throw new Error('Errore durante l\'aggiornamento dell\'hotel');
        }

        const updatedVacation = await response.json();
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
        loadHotels(updatedVacation.hotels);
    } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'hotel:', error.message);
    }
}

async function deleteHotel(vacationId, hotelId) {
    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/hotels/${hotelId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Errore durante l\'eliminazione dell\'hotel');
        }

        const updatedVacation = await response.json();
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
        loadHotels(updatedVacation.hotels);
    } catch (error) {
        console.error('Errore nell\'eliminazione dell\'hotel:', error.message);
    }
}

async function saveItinerary(vacationId) {
    const itineraryData = {
        date: document.getElementById('itineraryDate').value,
        time: document.getElementById('itineraryTime').value, // Aggiungi l'orario se necessario
        activities: document.getElementById('activities').value.split('\n'),
        coordinates: {
            lat: parseFloat(document.getElementById('lat').value),
            lng: parseFloat(document.getElementById('lng').value)
        }
    };

    try {
        // Salva l'itinerario nel backend
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/itinerary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itineraryData),
        });

        if (!response.ok) {
            throw new Error('Errore durante il salvataggio dell\'itinerario');
        }

        // Dopo aver salvato l'itinerario, recupera i dati aggiornati della vacanza
        const vacationResponse = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}`);
        if (!vacationResponse.ok) {
            throw new Error('Errore nel recuperare i dettagli della vacanza');
        }

        // Ottieni la vacanza aggiornata
        const updatedVacation = await vacationResponse.json();
        currentVacation = updatedVacation; // Aggiorna la vacanza corrente

        // Ordina e carica l'itinerario aggiornato nella card
        loadItinerary(updatedVacation.itinerary); // Funzione che ricarica e visualizza l'itinerario aggiornato

        // **Aggiorna il selettore di giorni con la nuova data**
        updateDaySelector(itineraryData.date); // Aggiungi questa linea per aggiornare il menu a tendina

        // Aggiungi subito il marker alla mappa con l'icona del segnale di posizione
        if (itineraryData.coordinates.lat && itineraryData.coordinates.lng) {
            L.marker([itineraryData.coordinates.lat, itineraryData.coordinates.lng], { icon: itineraryIcon })
                .addTo(map)
                .bindPopup(`<b>Itinerary:</b><br>${itineraryData.activities.join(', ')}`);
        }

        // Chiudi il modale dell'itinerario
        closeModal('itineraryModal');
        
    } catch (error) {
        console.error('Errore nel salvataggio dell\'itinerario:', error.message);
    }
}


async function updateItinerary(vacationId, itineraryId) {
    const itineraryData = {
        date: document.getElementById('itineraryDate').value,
        time: document.getElementById('itineraryTime').value, // Aggiungi l'orario
        activities: document.getElementById('activities').value.split('\n')
    };

    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/itinerary/${itineraryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itineraryData),
        });

        if (!response.ok) {
            throw new Error('Errore durante l\'aggiornamento dell\'itinerario');
        }

        const updatedVacation = await response.json();
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
        loadItinerary(updatedVacation.itinerary);
    } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'itinerario:', error.message);
    }
}


async function deleteItinerary(vacationId, itineraryId) {
    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/itinerary/${itineraryId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Errore durante l\'eliminazione dell\'itinerario');
        }

        const updatedVacation = await response.json();
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
        loadItinerary(updatedVacation.itinerary);
    } catch (error) {
        console.error('Errore nell\'eliminazione dell\'itinerario:', error.message);
    }
}

async function searchPlace() {
    const query = document.getElementById('mapSearchInput').value;
    if (!query) {
        alert('Please enter a location to search.');
        return;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];  // Prendi le coordinate del primo risultato
            map.setView([lat, lon], 14);  // Centra la mappa sul luogo cercato
            
            // Aggiungi un marker sulla posizione cercata
            L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${query}</b>`)
                .openPopup();
        } else {
            alert('Location not found. Try a different search.');
        }
    } catch (error) {
        console.error('Error during place search:', error);
    }
}


function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';

    // Solo distruggi la mappa se il modale è quello della mappa
    if (modalId === 'mapModal' && map) {
        map.remove();
        map = null;  // Imposta a null per consentire la reinizializzazione
    }
}


function goBack() {
    window.location.href = 'index.html'; // Torna alla homepage
}
