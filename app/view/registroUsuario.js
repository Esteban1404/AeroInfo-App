document.addEventListener('DOMContentLoaded', function() {
    const registroForm = document.getElementById('registroForm');
    registroForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(registroForm);
        fetch('/registro', {
            method: 'POST',
            body: formData
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al registrar usuario');
        });
    });
});
