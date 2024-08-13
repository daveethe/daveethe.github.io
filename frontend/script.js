const addVacationBtn = document.getElementById('addVacationBtn');
const vacationModal = document.getElementById('vacationModal');
const closeModal = document.querySelector('.close');
const vacationForm = document.getElementById('vacationForm');
const vacationList = document.getElementById('vacationList');

addVacationBtn.addEventListener('click', () => {
    vacationModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    vacationModal.style.display = 'none';
});

vacationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    console.log('Form data:', { name, startDate, endDate });

    const response = await fetch('http://localhost:5001/api/vacations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, startDate, endDate }),
    });

    const vacation = await response.json();
    displayVacation(vacation);

    vacationModal.style.display = 'none';
    vacationForm.reset();
});

async function fetchVacations() {
    const response = await fetch('http://localhost:5001/api/vacations');
    const vacations = await response.json();
    vacations.forEach(displayVacation);
}

function displayVacation(vacation) {
    const vacationElement = document.createElement('div');
    vacationElement.classList.add('vacation');
    vacationElement.innerHTML = `
        <h3>${vacation.name}</h3>
        <div class="actions">
            <button onclick="editVacation('${vacation._id}')">✏️</button>
            <button onclick="deleteVacation('${vacation._id}')">🗑️</button>
        </div>
    `;
    vacationList.appendChild(vacationElement);
}

async function deleteVacation(id) {
    await fetch(`http://localhost:5001/api/vacations/${id}`, {
        method: 'DELETE',
    });
    document.location.reload();
}

async function editVacation(id) {
    // Implementa la logica di modifica qui (simile a come si aggiunge una vacanza)
}

fetchVacations();
