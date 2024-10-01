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

        // Aggiungi il controllo per assicurarti che vacations sia un array
        if (Array.isArray(vacations)) {
            // Ordina le vacanze per data di inizio
            vacations.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            // Pulisce la lista corrente e visualizza tutte le vacanze
            vacationList.innerHTML = '';
            vacations.forEach(vacation => {
                displayVacation(vacation);
            });
        } else {
            console.error('Vacations non è un array:', vacations);
        }
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
    // Usa il modale di conferma personalizzato
    showConfirmModal(async () => {
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
    });
}


// Funzione per confermare l'eliminazione
function showConfirmModal(onConfirm) {
    const confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'flex'; // Mostra il modale

    // Quando l'utente conferma
    const confirmButton = confirmModal.querySelector('.btn-confirm');
    confirmButton.onclick = function() {
        confirmModal.style.display = 'none'; // Nascondi il modale
        onConfirm(); // Esegui la funzione passata come argomento
    };

    // Quando l'utente annulla
    const cancelButton = confirmModal.querySelector('.btn-cancel');
    cancelButton.onclick = function() {
        confirmModal.style.display = 'none'; // Nascondi il modale
    };
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
        firstDay: 1, // Imposta il lunedì come primo giorno della settimana
        displayEventTime: false, // Nasconde l'orario negli eventi
        events: async function(fetchInfo, successCallback, failureCallback) {
            try {
                const response = await fetch('https://vacation-planner-backend.onrender.com/api/vacations');
                const vacations = await response.json();
                
                const events = vacations.map(vacation => ({
                    id: vacation._id, // Aggiungi l'ID della vacanza come proprietà dell'evento
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
            // Reindirizza alla pagina dei dettagli della vacanza
            window.location.href = `vacation_details.html?id=${info.event.id}`;
        }
    });
    calendar.render();

});

document.addEventListener('DOMContentLoaded', async function() {
    // Recupera tutte le vacanze dal server
    const response = await fetch('https://vacation-planner-backend.onrender.com/api/vacations');
    const vacations = await response.json();

    // Trova la prossima vacanza
    const now = new Date();
    const upcomingVacation = vacations
        .filter(v => new Date(v.startDate) > now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

    if (upcomingVacation) {
        const countdownDate = new Date(upcomingVacation.startDate).getTime();

        // Aggiorna il countdown ogni secondo
        const interval = setInterval(function() {
            const now = new Date().getTime();
            const distance = countdownDate - now;

            if (distance < 0) {
                clearInterval(interval);
                document.getElementById("countdown").innerHTML = "Vacation Started!";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById("days").textContent = String(days).padStart(2, '0');
            document.getElementById("hours").textContent = String(hours).padStart(2, '0');
            document.getElementById("minutes").textContent = String(minutes).padStart(2, '0');
            document.getElementById("seconds").textContent = String(seconds).padStart(2, '0');
        }, 1000);
    }
});

// Funzione per il Logout
document.getElementById('logoutButton').addEventListener('click', function() {
    sessionStorage.removeItem('authenticated');  // Rimuovi lo stato di autenticazione
    window.location.href = 'login.html';  // Reindirizza alla pagina di login
});

