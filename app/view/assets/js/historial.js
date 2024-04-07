/*function listarDatos(){
    // Inicializar DataTable
    var tabla = $('#tblistado').DataTable();

    // Datos de ejemplo (pueden ser recibidos desde el servidor)
    var datos = [
        { nombre: 'Juan', edad: 25, pais: 'Argentina' },
        { nombre: 'María', edad: 30, pais: 'España' },
        { nombre: 'Pedro', edad: 28, pais: 'México' }
    ];

    // Agregar los datos a la tabla
    datos.forEach(function(item) {
        tabla.row.add([
            item.nombre,
            item.edad,
            item.pais
        ]).draw(false);
    });
};*/


function listarDatos() {
 
    var data = ["2024-04-01", "2024-04-02", "2024-04-03"];
  
    // Obtener la referencia al cuerpo de la tabla
  
    var tableBody = $("#tblistado tbody");
  
    // Llenar el cuerpo de la tabla con los datos
  
    $.each(data, function (index, value) {
      tableBody.append("<tr><td>" + value + "</td></tr>");
    });
  
    // Inicializar la tabla con DataTables
  
    tabla = $('#tblistado').DataTable({
      "processing": true, 
      "dom": 'Bfrtip', 
      "destroy": true,
      "iDisplayLength": 5,     
        "sEcho": 1,
      "iTotalRecords": 3,
      "iTotalDisplayRecords":3 
      
    });
  }


listarDatos();