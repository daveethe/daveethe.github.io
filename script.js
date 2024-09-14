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

// Seleziona l'icona del calendario e il div che contiene il calendario
const calendarButton = document.getElementById('calendarButton');
const calendarOverlay = document.getElementById('calendarOverlay');

// Aggiungi l'evento di click all'icona per visualizzare/nascondere il calendario
calendarButton.addEventListener('click', () => {
    calendarOverlay.style.display = 'flex'; // Mostra l'overlay e il calendario
});

// Nascondi il calendario quando l'utente clicca fuori dal calendario o preme ESC
calendarOverlay.addEventListener('click', (event) => {
    if (event.target === calendarOverlay) {
        calendarOverlay.style.display = 'none'; // Nasconde il calendario
    }
});

// Nascondi il calendario se l'utente preme il tasto "ESC"
document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
        calendarOverlay.style.display = 'none'; // Nasconde il calendario
    }
});

// Funzione per ottenere le vacanze dal server
async function fetchVacationsForCalendar() {
    try {
        const response = await fetch('https://vacation-planner-backend.onrender.com/api/vacations');
        const vacations = await response.json();

        // Estrai le date delle vacanze
        const vacationDates = vacations.map(vacation => {
            return {
                start: new Date(vacation.startDate).setHours(0, 0, 0, 0), // Imposta l'ora a mezzanotte
                end: new Date(vacation.endDate).setHours(23, 59, 59, 999) // Imposta la fine del giorno
            };
        });

        // Inizializza il calendario flatpickr con le date delle vacanze evidenziate
        flatpickr('#calendarInput', {
            inline: true, // Mostra il calendario sempre aperto
            mode: 'range', // Permette di selezionare intervalli di date
            disable: vacationDates.map(v => ({ 
                from: new Date(v.start), 
                to: new Date(v.end)
            })),
            enable: vacationDates.map(v => ({ 
                from: new Date(v.start), 
                to: new Date(v.end)
            })),
            onDayCreate: function(dObj, dStr, fp, dayElem) {
                // Colora i giorni delle vacanze
                const date = new Date(dayElem.dateObj).setHours(0, 0, 0, 0); // Imposta l'ora a mezzanotte
                const inVacation = vacationDates.some(v => {
                    const start = v.start;
                    const end = v.end;
                    return date >= start && date <= end;
                });

                if (inVacation) {
                    dayElem.style.backgroundColor = '#FFDD57'; // Colore per i giorni di vacanza
                    dayElem.style.color = 'white';
                }
            }
        });
    } catch (error) {
        console.error('Errore nel recupero delle vacanze:', error);
    }
}

// Recupera le vacanze e configura il calendario al caricamento della pagina
fetchVacationsForCalendar();
