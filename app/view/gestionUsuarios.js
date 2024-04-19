const oracleDb = require('oracledb');

// Función para agregar un nuevo usuario utilizando procedimientos almacenados
async function agregarUsuario(req, res, connection) {
    try {
        const { NOMBRE, CORREO, PASSWORD, ROL } = req.body;

        // Usando el procedimiento almacenado para insertar el usuario
        const sql = `BEGIN PKG_USUARIOS.AGREGAR_USUARIO(:NOMBRE, :CORREO, :PASSWORD, :ROL); END;`;

        await connection.execute(sql, {
            NOMBRE,
            CORREO,
            PASSWORD,
            ROL
        }, { autoCommit: true });

        // Enviar respuesta de éxito con redirección
        res.status(200).send('<script>alert("Usuario agregado correctamente"); window.location.href = "gestionUsuarios.html";</script>');
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        // Enviar respuesta de error con popup y redirección
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "gestionUsuarios.html";</script>');
    }
}

// Función para editar un usuario utilizando procedimientos almacenados
async function editarUsuario(req, res, connection) {
    try {
        const { ID_USUARIO, NOMBRE, CORREO, PASSWORD, ROL } = req.body;

        // Usando el procedimiento almacenado para actualizar el usuario
        const sql = `BEGIN PKG_USUARIOS.EDITAR_USUARIO(:ID_USUARIO, :NOMBRE, :CORREO, :PASSWORD, :ROL); END;`;

        await connection.execute(sql, {
            ID_USUARIO,
            NOMBRE,
            CORREO,
            PASSWORD,
            ROL
        }, { autoCommit: true });

        // Enviar respuesta de éxito con redirección
        res.status(200).send('<script>alert("Usuario actualizado correctamente"); window.location.href = "gestionUsuarios.html";</script>');
    } catch (error) {
        console.error('Error al editar usuario:', error);
        // Enviar respuesta de error con popup y redirección
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "gestionUsuarios.html";</script>');
    }
}

// Función para eliminar un usuario utilizando procedimientos almacenados
async function borrarUsuario(req, res, connection) {
    try {
        const { ID_USUARIO } = req.body;

        // Usando el procedimiento almacenado para borrar el usuario
        const sql = `BEGIN PKG_USUARIOS.BORRAR_USUARIO(:ID_USUARIO); END;`;

        await connection.execute(sql, [ID_USUARIO], { autoCommit: true });

        // Enviar respuesta de éxito con redirección
        res.status(200).send('<script>alert("Usuario borrado correctamente"); window.location.href = "gestionUsuarios.html";</script>');
    } catch (error) {
        console.error('Error al borrar usuario:', error);
        // Enviar respuesta de error con popup y redirección
        res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "gestionUsuarios.html";</script>');
    }
}

module.exports = { agregarUsuario, editarUsuario, borrarUsuario };
