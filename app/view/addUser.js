var dropdownRoles = document.getElementById('ROL');

const url = 'http://localhost:3000/obtenerRoles';

fetch(url).then(resp => {
    if(!resp.ok){
        throw new Error('Error al obtener los roles');
    }

    return resp.json();
}).then(data => {
    console.log(data);

    data.forEach(rol => {
        var option = document.createElement('option');
        option.text = rol.Rol_Desc;
        option.value = rol.Id_Rol;
        dropdownRoles.appendChild(option);
    });
}).catch(error => {
    console.error(error);
});

var dropdownValue = document.getElementById('ROL').value;

console.log(dropdownValue);

