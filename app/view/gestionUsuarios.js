$.ajax({
    type: 'GET',
    url: 'http://localhost:3000/obtenerUsuarios',
    success: function(data){
        console.log(data);
        cargarUsuarios(data);
    }
});

function cargarUsuarios(data){

    var tabla = $('#tableUsuarios');

    var tbody = $('tbody');

    tbody.empty();
    data.forEach(usuario =>{
        var fila = $('<tr>');
        fila.append($('<td>').text(usuario.ID));
        fila.append($('<td>').text(usuario.NOMBRE));
        fila.append($('<td>').text(usuario.CORREO));
        if(usuario.ROL == 1){
            fila.append($('<td>').text('USUARIO NORMAL'));
        }
        else if(usuario.ROL == 2){
            fila.append($('<td>').text('ADMINISTRADOR'));
        }
        else if(usuario.ROL == 3){
            fila.append($('<td>').text('GERENTE'));
        }
        if(usuario.ESTADO == 1){
            fila.append($('<td>').text('ACTIVO'));
        }else if(usuario.ESTADO == 0){
            fila.append($('<td>').text('INACTIVO'));
        }
        tbody.append(fila);
    });

    tabla.append(tbody);

}