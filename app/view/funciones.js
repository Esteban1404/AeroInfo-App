const oracleDb = require('oracledb');

// Función para agregar un nuevo vuelo
async function agregarVuelo(req, res, connection) {
    try {
        const { NUMERO_VUELO, DESTINO, ESTADO, HORA_SALIDA, HORA_LLEGADA } = req.body;

        // Consulta SQL para insertar el vuelo
        const query = `INSERT INTO Vuelo (Numero_Vuelo, Destino, Estado, Hora_Salida, Hora_Llegada)
                       VALUES (:NUMERO_VUELO, :DESTINO, :ESTADO, TO_TIMESTAMP(:HORA_SALIDA, 'YYYY-MM-DD"T"HH24:MI:SS'), TO_TIMESTAMP(:HORA_LLEGADA, 'YYYY-MM-DD"T"HH24:MI:SS'))`;

        // Ejecutar la consulta
        const result = await connection.execute(query, {
            NUMERO_VUELO,
            DESTINO,
            ESTADO,
            HORA_SALIDA,
            HORA_LLEGADA
        });

        // Commit de la transacción
        await connection.commit();

        // Enviar respuesta de éxito
        res.status(200).send('<script>alert("Vuelo agregado correctamente"); window.location.href = "agregarVuelos.html";</script>');
    } catch (error) {
        console.error('Error al agregar vuelo:', error.message);
        // Rollback de la transacción en caso de error
        await connection.rollback();
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "agregarVuelos.html";</script>');
    }
}

// Función para editar un vuelo
async function editarVuelo(req, res, connection) {
    try {
        const { NUMERO_VUELO, DESTINO, ESTADO, HORA_SALIDA, HORA_LLEGADA } = req.body;

        // Consulta SQL para actualizar el vuelo
        const query = `UPDATE Vuelo 
                       SET Destino = :DESTINO, 
                           Estado = :ESTADO, 
                           Hora_Salida = TO_TIMESTAMP(:HORA_SALIDA, 'YYYY-MM-DD"T"HH24:MI:SS'), 
                           Hora_Llegada = TO_TIMESTAMP(:HORA_LLEGADA, 'YYYY-MM-DD"T"HH24:MI:SS')
                       WHERE Numero_Vuelo = :NUMERO_VUELO`;

        // Ejecutar la consulta
        const result = await connection.execute(query, {
            NUMERO_VUELO,
            DESTINO,
            ESTADO,
            HORA_SALIDA,
            HORA_LLEGADA
        });

        // Commit de la transacción
        await connection.commit();

        // Enviar respuesta de éxito
        res.status(200).send('<script>alert("Vuelo actualizado correctamente"); window.location.href = "agregarVuelos.html";</script>');
    } catch (error) {
        console.error('Error al editar vuelo:', error.message);
        // Rollback de la transacción en caso de error
        await connection.rollback();
        // Enviar respuesta de error con popup y redirección
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "agregarVuelos.html";</script>');
    }
}
// Función para borrar un vuelo
async function borrarVuelo(req, res, connection) {
    try {
        const { NUMERO_VUELO } = req.body;

        // Consulta SQL para borrar el vuelo
        const query = `DELETE FROM Vuelo WHERE NUMERO_VUELO = :NUMERO_VUELO`;

        // Ejecutar la consulta
        const result = await connection.execute(query, [NUMERO_VUELO]);

        // Commit de la transacción
        await connection.commit();

        // Enviar respuesta de éxito
        res.status(200).send('<script>alert("Vuelo borrado correctamente"); window.location.href = "agregarVuelos.html";</script>');
    } catch (error) {
        console.error('Error al borrar vuelo:', error.message);
        // Rollback de la transacción en caso de error
        await connection.rollback();
        // Enviar respuesta de error
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "agregarVuelos.html";</script>');
    }
}
async function verificarEquipaje(req, res, connection) {
    let result;
    try {
        const { ID_PASAJERO } = req.body;

        // Consulta SQL para verificar el equipaje del pasajero
        const query = `
            SELECT ID_Equipaje, ID_Pasajero, Numero_Vuelo, ID_Cliente, Peso, Estado 
            FROM Equipaje 
            WHERE ID_Pasajero = :ID_PASAJERO
        `;

        // Ejecutar la consulta
        result = await connection.execute(query, [ID_PASAJERO]);

        // Comprobar si se encontraron registros
        if (result.rows.length > 0) {
            // Enviar respuesta con la información del equipaje
            res.status(200).send(result.rows);
        } else {
            // Enviar respuesta indicando que no se encontró equipaje para el pasajero
            res.status(404).send('<script>alert("No se encontró equipaje para el pasajero"); window.location.href = "equipaje.html";</script>');
        }
    } catch (error) {
        console.error('Error al verificar equipaje:', error.message);
        // Enviar respuesta de error
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "equipaje.html";</script>');
    }
}
module.exports = { agregarVuelo, editarVuelo, borrarVuelo,verificarEquipaje };


