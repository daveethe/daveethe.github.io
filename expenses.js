document.addEventListener('DOMContentLoaded', function() {
    const expenseForm = document.getElementById('expenseForm');
    const expenseList = document.getElementById('expenseList');
    const vacationNameElement = document.getElementById('vacationName'); // Elemento per il nome della vacanza
    const categoryButtons = document.querySelectorAll('.category-buttons button');
    let selectedCategory = '';
    const vacationId = new URLSearchParams(window.location.search).get('id'); // Ottieni l'ID della vacanza dall'URL

    if (vacationId) {
        // Carica il nome della vacanza
        fetchVacationName(vacationId);
    }

    // Funzione per caricare il nome della vacanza
    async function fetchVacationName(vacationId) {
        try {
            const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}`);
            if (!response.ok) {
                throw new Error('Errore nel caricamento del nome della vacanza');
            }
            const vacationData = await response.json();
            vacationNameElement.textContent = vacationData.name;  // Imposta il nome della vacanza nell'elemento h1
        } catch (error) {
            console.error('Errore nel caricamento del nome della vacanza:', error.message);
            vacationNameElement.textContent = 'Errore nel caricamento del nome della vacanza';
        }
    }

    // Carica le spese esistenti all'avvio della pagina
    loadExpenses();

    // Gestisci la selezione delle categorie
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            selectedCategory = this.getAttribute('data-category');
        });
    });

    // Funzione per gestire l'invio del modulo
    expenseForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const expenseData = {
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value).toFixed(2),
            category: selectedCategory
        };

        // Verifica che una categoria sia selezionata
        if (!selectedCategory) {
            alert('Seleziona una categoria per la spesa.');
            return;
        }

        try {
            const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData),
            });

            if (!response.ok) {
                throw new Error('Errore durante l\'aggiunta della spesa');
            }

            const newExpense = await response.json();
            displayExpense(newExpense);  // Assicurati che il nuovo ID sia usato in displayExpense

            expenseForm.reset();  // Resetta il modulo dopo l'invio
            selectedCategory = '';  // Resetta la categoria selezionata

        } catch (error) {
            console.error('Errore nel salvataggio della spesa:', error.message);
        }
    });

    // Funzione per caricare le spese esistenti dal backend
    async function loadExpenses() {
        try {
            const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/expenses`);
            if (!response.ok) {
                throw new Error('Errore nel caricamento delle spese');
            }
            const expenses = await response.json();
            expenses.forEach(expense => displayExpense(expense));  // Visualizza tutte le spese
        } catch (error) {
            console.error('Errore nel caricamento delle spese:', error.message);
        }
    }

    // Funzione per eliminare le spese esistenti dal backend
    async function deleteExpense(expenseId, expenseElement, amount) {
        showConfirmModal(async () => {
            try {
                const response = await fetch(`https://vacation-planner-backend.onrender.com/api/vacations/${vacationId}/expenses/${expenseId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Errore durante l\'eliminazione della spesa');
                }

                expenseElement.classList.add('fade-out-left');

                setTimeout(() => {
                    expenseElement.remove();
                    totalAmount -= parseFloat(amount);
                    document.getElementById('totalAmount').textContent = `€ ${totalAmount.toFixed(2)}`;
                }, 1000);

            } catch (error) {
                console.error('Errore durante l\'eliminazione della spesa:', error.message);
            }
        });
    }

    // Funzione per mostrare il popup di conferma
    function showConfirmModal(onConfirm) {
        const confirmModal = document.getElementById('confirmModal');
        confirmModal.style.display = 'flex';

        const confirmButton = confirmModal.querySelector('.btn-confirm');
        confirmButton.onclick = function() {
            confirmModal.style.display = 'none';
            onConfirm();
        };

        const cancelButton = confirmModal.querySelector('.btn-cancel');
        cancelButton.onclick = function() {
            confirmModal.style.display = 'none';
        };
    }

    // Funzione per visualizzare una singola spesa
    let totalAmount = 0;

    function displayExpense(expense) {
        const expenseElement = document.createElement('div');
        expenseElement.classList.add('expense-item');

        let icon;
        switch (expense.category) {
            case 'flight': icon = '<i data-lucide="plane"></i>'; break;
            case 'hotel': icon = '<i data-lucide="hotel"></i>'; break;
            case 'car': icon = '<i data-lucide="car"></i>'; break;
            case 'groceries': icon = '<i data-lucide="shopping-cart"></i>'; break;
            case 'activities': icon = '<i data-lucide="activity"></i>'; break;
            case 'other': icon = '<i data-lucide="list"></i>';
        }

        expenseElement.innerHTML = `
        <div>
            <div class="expense-row">${icon} <span class="expense-description">${expense.description}</span></div> 
        </div>
        <div class="expense-amount">
            ${parseFloat(expense.amount).toFixed(2)} €
            <button class="delete-expense" data-id="${expense._id}"><i data-lucide="trash-2"></i></button>
        </div>
        `;

        expenseElement.classList.add('fade-in-bottom');
        expenseList.appendChild(expenseElement);

        setTimeout(() => {
            expenseElement.classList.remove('fade-in-bottom');
        }, 1000);

        totalAmount += parseFloat(expense.amount);
        document.getElementById('totalAmount').innerHTML = `<i data-lucide="euro"></i> ${totalAmount.toFixed(2)}`;

        expenseElement.querySelector('.delete-expense').addEventListener('click', function() {
            deleteExpense(expense._id, expenseElement, expense.amount);
        });

        lucide.createIcons();
    }

});

function goBack() {
    window.history.back();
}
