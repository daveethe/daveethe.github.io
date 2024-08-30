let currentVacation = null; // Definizione globale

let isRedirecting = false;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const vacationId = urlParams.get('id');

    if (!vacationId && !isRedirecting) {
        isRedirecting = true; // Setta lo stato per evitare reindirizzamenti multipli
        alert('No vacation selected');
        window.location.href = 'index.html';
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
    } catch (error) {
        console.error('Errore:', error.message);
        // Assicurati che errori gestiti non causino un reindirizzamento non necessario
    }

    // Aggiungi i gestori di eventi per i pulsanti
    document.getElementById('addFlightBtn').addEventListener('click', () => openModal('flightModal', 'add'));
    document.getElementById('addHotelBtn').addEventListener('click', () => openModal('hotelModal', 'add'));
    document.getElementById('addItineraryBtn').addEventListener('click', () => openModal('itineraryModal', 'add'));

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

function loadFlights(flights) {
    const flightList = document.getElementById('flightList');
    flightList.innerHTML = ''; // Pulisce la lista corrente

    flights.forEach((flight, index) => {
        const flightItem = document.createElement('div');
        flightItem.className = 'flight-item';

        // Template per il nuovo layout dei voli
        flightItem.innerHTML = `
            <div class="flight-header">
                <span>${index + 1}. Partenza</span>
                <span>${new Date(flight.departureTime).toLocaleDateString()}</span>
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
                    <p><strong>Check-in:</strong> ${new Date(hotel.checkInDate).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> ${new Date(hotel.checkOutDate).toLocaleDateString()}</p>
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

    itinerary.forEach(day => {
        const itineraryItem = document.createElement('div');
        itineraryItem.className = 'itinerary-item';
        itineraryItem.innerHTML = `
            <div class="itinerary-content">
                <p><strong>Date:</strong> ${new Date(day.date).toLocaleDateString()}</p>
                <p><strong>Activities:</strong></p>
                <ul>
                    ${day.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
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
    if (!formElement) {
        console.error(`Form element with ID ${formId} not found.`);
        return;
    }

    const modalTitleElement = document.getElementById(`${modalId}Title`);
    if (!modalTitleElement) {
        console.error(`Modal title element with ID ${modalId}Title not found.`);
        return;
    }

    if (mode === 'add') {
        modalTitleElement.innerText = `Add ${modalId.split('Modal')[0]}`;
        formElement.reset();
        document.getElementById(`${modalId.split('Modal')[0]}Id`).value = ''; // Clear hidden input for new data
    } else if (mode === 'edit') {
        modalTitleElement.innerText = `Edit ${modalId.split('Modal')[0]}`;
        Object.keys(data).forEach(key => {
            if (document.getElementById(key)) {
                document.getElementById(key).value = data[key];
            }
        });
        document.getElementById(`${modalId.split('Modal')[0]}Id`).value = data._id; // Set hidden input for editing
    }
    document.getElementById(modalId).style.display = 'block';
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
    } else {
        console.error('Itinerary not found.');
    }
}

async function saveFlight(vacationId) {
    const flightData = {
        airline: document.getElementById('airline').value,
        flightNumber: document.getElementById('flightNumber').value,
        departureTime: document.getElementById('departureTime').value,
        arrivalTime: document.getElementById('arrivalTime').value
    };

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
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
        loadFlights(updatedVacation.flights);
    } catch (error) {
        console.error('Errore nel salvataggio del volo:', error.message);
    }
}

async function updateFlight(vacationId, flightId) {
    const flightData = {
        airline: document.getElementById('airline').value,
        flightNumber: document.getElementById('flightNumber').value,
        departureTime: document.getElementById('departureTime').value,
        arrivalTime: document.getElementById('arrivalTime').value
    };

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
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
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
        activities: document.getElementById('activities').value.split('\n')
    };

    try {
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

        const updatedVacation = await response.json();
        currentVacation = updatedVacation; // Aggiorna currentVacation con i dati aggiornati
        loadItinerary(updatedVacation.itinerary);
    } catch (error) {
        console.error('Errore nel salvataggio dell\'itinerario:', error.message);
    }
}

async function updateItinerary(vacationId, itineraryId) {
    const itineraryData = {
        date: document.getElementById('itineraryDate').value,
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

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function goBack() {
    window.location.href = 'index.html'; // Torna alla homepage
}
