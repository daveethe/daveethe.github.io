// Seleziona gli elementi del DOM
const addVacationBtn = document.getElementById('addVacationBtn');
const vacationModal = document.getElementById('vacationModal');
const closeModal = document.querySelector('.close');
const vacationForm = document.getElementById('vacationForm');
const vacationList = document.getElementById('vacationList');

// Variabili di stato per la gestione di creazione/modifica
let isEditing = false;
let editingVacationId = null;

// Mostra il modale per aggiungere una nuova vacanza
addVacationBtn.addEventListener('click', () => {
    isEditing = false; // Resetta la modalità di modifica
    editingVacationId = null;
    vacationModal.style.display = 'flex';
});

// Chiudi il modale con un'animazione
closeModal.addEventListener('click', () => {
    vacationModal.style.opacity = 0;  // Anima la trasparenza verso 0
    setTimeout(() => {
        vacationModal.style.display = 'none';  // Nascondi il modale dopo un breve ritardo
        vacationModal.style.opacity = 1;  // Ripristina la trasparenza per la prossima apertura
    }, 300);  // 300 millisecondi di ritardo per l'animazione di chiusura
});

// Gestisce il submit del modulo
vacationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (isEditing) {
        // Logica per aggiornare la vacanza esistente
        try {
            const updateResponse = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${editingVacationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, startDate, endDate }),
            });

            if (!updateResponse.ok) {
                throw new Error('Errore nell\'aggiornamento della vacanza');
            }

            // Nascondi il modale e aggiorna l'elenco delle vacanze
            vacationModal.style.display = 'none';
            isEditing = false;
            editingVacationId = null;
            location.reload(); // Ricarica la lista delle vacanze

        } catch (error) {
            console.error('Errore durante l\'aggiornamento della vacanza:', error.message);
        }
    } else {
        // Logica per creare una nuova vacanza
        try {
            console.log('Form data:', { name, startDate, endDate });

            const response = await fetch('https://vacation-planner-backend.onrender.com/api/vacations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, startDate, endDate }),
            });

            if (!response.ok) {
                throw new Error('Errore durante la creazione della vacanza');
            }

            const vacation = await response.json();
            displayVacation(vacation); // Mostra la vacanza appena creata
            vacationModal.style.display = 'none';
            vacationForm.reset();
        } catch (error) {
            console.error('Errore durante la creazione della vacanza:', error.message);
        }
    }
});

// Funzione per recuperare tutte le vacanze dal backend
async function fetchVacations() {
    try {
        const response = await fetch('https://vacation-planner-backend.onrender.com/api/vacations');
        if (!response.ok) {
            throw new Error('Errore nel recuperare le vacanze');
        }
        const vacations = await response.json();

        // Ordina le vacanze per data di inizio
        vacations.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        // Pulisce la lista corrente e visualizza tutte le vacanze
        vacationList.innerHTML = '';
        vacations.forEach(vacation => {
            displayVacation(vacation);
        });
    } catch (error) {
        console.error('Errore nel recuperare le vacanze:', error.message);
    }
}

// Funzione per visualizzare una singola vacanza come card
function displayVacation(vacation) {
    const vacationElement = document.createElement('div');
    vacationElement.classList.add('vacation');
    vacationElement.innerHTML = `
        <h3>${vacation.name}</h3>
        <p>From: ${new Date(vacation.startDate).toLocaleDateString()} To: ${new Date(vacation.endDate).toLocaleDateString()}</p>
        <div class="actions">
            <button class="edit-btn">✏️</button>
            <button class="delete-btn">🗑️</button>
        </div>
    `;
    
    // Aggiungi comportamento al click per aprire la pagina dei dettagli della vacanza
    vacationElement.addEventListener('click', () => {
        window.location.href = `vacation_details.html?id=${vacation._id}`;
    });

    // Aggiungi gestione clic per la matitina (modifica vacanza)
    vacationElement.querySelector('.edit-btn').addEventListener('click', (event) => {
        event.stopPropagation(); // Previene la propagazione dell'evento di clic alla card
        editVacation(vacation._id);
    });

    // Aggiungi gestione clic per il cestino (elimina vacanza)
    vacationElement.querySelector('.delete-btn').addEventListener('click', (event) => {
        event.stopPropagation(); // Previene la propagazione dell'evento di clic alla card
        deleteVacation(vacation._id);
    });

    vacationList.appendChild(vacationElement);
}


// Funzione per eliminare una vacanza
async function deleteVacation(id) {
    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Errore nella cancellazione della vacanza');
        }

        // Ricarica l'elenco delle vacanze dopo la cancellazione
        location.reload();
    } catch (error) {
        console.error('Errore durante la cancellazione della vacanza:', error.message);
    }
}

// Funzione per modificare una vacanza esistente
async function editVacation(id) {
    console.log(`Edit button clicked for vacation with ID: ${id}`);

    try {
        const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${id}`);
        if (!response.ok) {
            throw new Error('Errore nel recuperare i dati della vacanza');
        }
        const vacation = await response.json();

        // Popolare i campi del modale con i dati della vacanza
        document.getElementById('name').value = vacation.name;
        document.getElementById('startDate').value = vacation.startDate.substring(0, 10);
        document.getElementById('endDate').value = vacation.endDate.substring(0, 10);

        // Mostra il modale di modifica e imposta la modalità di modifica
        vacationModal.style.display = 'flex';
        isEditing = true;
        editingVacationId = id;
    } catch (error) {
        console.error('Errore nel recuperare i dati della vacanza:', error.message);
    }
}

// Carica tutte le vacanze all'avvio
fetchVacations();


document.addEventListener('DOMContentLoaded', function() {
    const calendarButton = document.getElementById('calendarButton');
    const calendarOverlay = document.getElementById('calendarOverlay');

    // Mostra l'overlay quando si clicca sull'icona del calendario
    calendarButton.addEventListener('click', function() {
        calendarOverlay.style.display = 'flex';

        // Forza il rendering corretto del calendario quando diventa visibile
        setTimeout(function() {
            calendar.render();  // Assicurati che il calendario venga renderizzato correttamente
        }, 100);  // Aggiungi un breve ritardo per il rendering
    });

    // Chiudi l'overlay cliccando fuori dal calendario
    calendarOverlay.addEventListener('click', function(event) {
        if (event.target === calendarOverlay) {
            calendarOverlay.style.display = 'none';
        }
    });

    // Inizializza FullCalendar
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: async function(fetchInfo, successCallback, failureCallback) {
            try {
                const response = await fetch('https://vacation-planner-backend.onrender.com/api/vacations');
                const vacations = await response.json();
                
                const events = vacations.map(vacation => ({
                    title: vacation.name,
                    start: vacation.startDate,
                    end: vacation.endDate,
                    backgroundColor: '#378006'
                }));
                
                successCallback(events);
            } catch (error) {
                console.error('Errore durante il recupero degli eventi:', error);
                failureCallback(error);
            }
        },
        editable: true,
        dateClick: function(info) {
            alert('Hai cliccato la data: ' + info.dateStr);
        },
        eventClick: function(info) {
            window.location.href = `vacation_details.html?id=${info.event.id}`;
        }
    });
    calendar.render();
});
