const oracleDb = require('oracledb');

// Función para agregar un nuevo usuario
async function agregarUsuario(req, res, connection) {
    try {
        const { NOMBRE, CORREO, PASSWORD, ROL } = req.body;

        // Consulta SQL para insertar el usuario
        const query = `INSERT INTO Usuario (Nombre, Correo, Password, Rol)
                       VALUES (:NOMBRE, :CORREO, :PASSWORD, :ROL)`;

        // Ejecutar la consulta
        const result = await connection.execute(query, {
            NOMBRE,
            CORREO,
            PASSWORD,
            ROL
        });

        // Commit de la transacción
        await connection.commit();

        // Enviar respuesta de éxito con redirección
        res.status(200).send('<script>alert("Usuario agregado correctamente"); window.location.href = "gestionUsuarios.html";</script>');
    } catch (error) {
        console.error('Error al agregar usuario:', error.message);
        // Rollback de la transacción en caso de error
        await connection.rollback();
        // Enviar respuesta de error con popup y redirección
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "gestionUsuarios.html";</script>');
    }
}

// Función para editar un usuario
async function editarUsuario(req, res, connection) {
    try {
        const { ID_USUARIO, NOMBRE, CORREO, PASSWORD, ROL } = req.body;

        // Consulta SQL para actualizar el usuario
        const query = `UPDATE Usuario 
                       SET Nombre = :NOMBRE, 
                           Correo = :CORREO, 
                           Password = :PASSWORD, 
                           Rol = :ROL
                       WHERE ID_Usuario = :ID_USUARIO`;

        // Ejecutar la consulta
        const result = await connection.execute(query, {
            ID_USUARIO,
            NOMBRE,
            CORREO,
            PASSWORD,
            ROL
        });

        // Commit de la transacción
        await connection.commit();

        // Enviar respuesta de éxito con redirección
        res.status(200).send('<script>alert("Usuario actualizado correctamente"); window.location.href = "gestionUsuarios.html";</script>');
    } catch (error) {
        console.error('Error al editar usuario:', error.message);
        // Rollback de la transacción en caso de error
        await connection.rollback();
        // Enviar respuesta de error con popup y redirección
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "gestionUsuarios.html";</script>');
    }
}

// Función para eliminar un usuario
async function borrarUsuario(req, res, connection) {
    try {
        const { ID_USUARIO } = req.body;

        // Consulta SQL para borrar el usuario
        const query = `DELETE FROM Usuario WHERE ID_Usuario = :ID_USUARIO`;

        // Ejecutar la consulta
        const result = await connection.execute(query, [ID_USUARIO]);

        // Commit de la transacción
        await connection.commit();

        // Enviar respuesta de éxito con redirección
        res.status(200).send('<script>alert("Usuario borrado correctamente"); window.location.href = "gestionUsuarios.html";</script>');
    } catch (error) {
        console.error('Error al borrar usuario:', error.message);
        // Rollback de la transacción en caso de error
        await connection.rollback();
        // Enviar respuesta de error con popup y redirección
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "gestionUsuarios.html";</script>');
    }
}

module.exports = { agregarUsuario, editarUsuario, borrarUsuario };
