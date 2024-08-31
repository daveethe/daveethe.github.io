document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Password prestabilita
        const presetPassword = 'Foufou12$'; // Sostituisci con la tua password

        // Valore inserito dall'utente
        const password = document.getElementById('password').value;

        // Verifica della password
        if (password === presetPassword) {
            // Password corretta, salva lo stato di autenticazione e reindirizza
            sessionStorage.setItem('authenticated', 'true');
            window.location.href = 'index.html'; // Reindirizza alla tua pagina principale
        } else {
            // Password errata, mostra il messaggio di errore
            errorMessage.style.display = 'block';
        }
    });
});
