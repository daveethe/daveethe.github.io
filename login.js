document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('password');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Prendiamo la password inserita dall'utente
        const password = passwordField.value;

        // Invia la password al server per la verifica
        try {
            const response = await fetch('https://vacation-planner-backend.onrender.com/api/vacations/verifyPassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();

            if (result.success) {
                // Se la password è corretta, reindirizza alla home
                sessionStorage.setItem('authenticated', 'true');
                window.location.href = 'index.html';
            } else {
                // Se la password è errata, mostra un messaggio di errore
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Errore durante il login:', error);
        }
    });

    // Aggiungi la funzionalità per mostrare/nascondere la password
    togglePassword.addEventListener('click', function() {
        // Cambia il tipo di input da "password" a "text" o viceversa
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);

        // Cambia l'icona
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});
