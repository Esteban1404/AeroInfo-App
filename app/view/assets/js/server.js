const express = require('express');
const bodyParser = require('body-parser');
const oracle = require('oracledb');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

// Middleware de análisis de cuerpo de solicitud
app.use(express.static(path.join(__dirname, '..', 'views')));
app.use('/css', express.static(path.join(__dirname, '..', 'CSS')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de la base de datos Oracle
const dbConfig = {
    user: 'AeroInfo',
    password: 'Aeroinfo_LBD',
    connectString: 'localhost:1521/orcl'
};

// Función para enviar un popup de registro exitoso al cliente
function registroExitoso(res) {
    // Emitir código JavaScript para mostrar el popup de registro exitoso
    res.send('<script>alert("¡Registro exitoso!"); window.location.href = "login.html";</script>');
}

// Función para hacer hash de la contraseña
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// Ruta para manejar las solicitudes de verificación de cuenta
app.post('/verificarCuenta', async (req, res) => {
    try {
        const { correoElectronico } = req.body;
        
        // Aquí puedes realizar la lógica de verificación de la cuenta
        
        // Por ahora, simplemente enviar una respuesta de éxito como ejemplo
        res.status(200).send({ success: true, message: 'Cuenta verificada correctamente.', correoElectronico: correoElectronico });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error interno del servidor.' });
    }
});

// Ruta para manejar las solicitudes de registro de usuarios
app.post('/registro', async (req, res) => {
    const { nombreCompleto, correoElectronico, contraseña } = req.body;

    let connection;
    try {
        connection = await oracle.getConnection(dbConfig);

        // Verificar si el correo electrónico ya está registrado
        const checkUserResult = await connection.execute(
            `SELECT COUNT(*) FROM USUARIOS WHERE CORREO_ELECTRONICO = :correoElectronico`,
            [correoElectronico]
        );

        if (checkUserResult.rows[0][0] > 0) {
            // Si el correo electrónico ya está registrado, enviar un mensaje de error
            res.status(400).send('<script>alert("El correo electrónico ya está registrado."); window.location.href = "registro.html";</script>');
        } else {
            // Si el correo electrónico no está registrado, proceder con el registro
            // Hacer hash de la contraseña antes de almacenarla en la base de datos
            const hashedPassword = await hashPassword(contraseña);

            // Insertar el nuevo usuario en la base de datos
            const insertUserResult = await connection.execute(
                `INSERT INTO USUARIOS (NOMBRE_COMPLETO, CORREO_ELECTRONICO, CONTRASEÑA) VALUES (:nombreCompleto, :correoElectronico, :hashedPassword)`,
                [nombreCompleto, correoElectronico, hashedPassword]
            );

            // Confirmar la transacción
            await connection.commit();

            // Cerrar la conexión
            await connection.close();

            // Enviar un script de JavaScript para mostrar un mensaje de éxito al cliente
            res.send('<script>alert("¡Registro exitoso!"); window.location.href = "login.html";</script>');
        }
    } catch (error) {
        console.error(error);
        if (connection) {
            await connection.close();
        }
        // Enviar un mensaje de error al cliente en caso de error
        res.status(500).send('<script>alert("Error interno del servidor."); window.location.href = "registro.html";</script>');
    }
});

// Ruta para manejar las solicitudes de inicio de sesión
app.post('/login', async (req, res) => {
    try {
        const { correoElectronico, contraseña } = req.body;
        let connection = await oracle.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT NOMBRE_COMPLETO, CONTRASEÑA FROM USUARIOS WHERE CORREO_ELECTRONICO = :correoElectronico`,
            [correoElectronico]
        );
        // Verificar si se encontró un usuario con las credenciales proporcionadas
        if (result.rows.length > 0) {
            const usuario = result.rows[0]; // Obtener la fila del usuario desde la consulta
            const nombreUsuario = usuario[0];
            const hashedPassword = usuario[1]; // Obtener la contraseña hasheada del usuario
            // Verificar la contraseña
            const passwordMatch = await bcrypt.compare(contraseña, hashedPassword);
            if (passwordMatch) {
                // Obtener el ID del usuario
                const idResult = await obtenerIdUsuario(correoElectronico);
                if (idResult.success) {
                    const userId = idResult.userId;
                    // Aquí puedes hacer lo que necesites con el ID del usuario
                    console.log('ID del usuario:', userId);
                } else {
                    console.error('Usuario no encontrado.');
                }
                // Enviar un script de JavaScript para mostrar el mensaje de bienvenida y redirigir a principal.html
                res.send(`<script>alert('¡Bienvenid@ ${nombreUsuario}!'); window.location.href = 'principal.html';</script>`);
            } else {
                // Si las credenciales son incorrectas, enviar un script de JavaScript para mostrar un mensaje de error y redirigir a login.html
                res.send("<script>alert('Correo electrónico o contraseña incorrectos.'); window.location.href = 'login.html';</script>");
            }
        } else {
            // Si el usuario no existe, enviar un script de JavaScript para mostrar un mensaje de error y redirigir a login.html
            res.send("<script>alert('Correo electrónico o contraseña incorrectos.'); window.location.href = 'login.html';</script>");
        }
        await connection.close();
    } catch (error) {
        console.error(error);
        // Enviar un script de JavaScript para mostrar un mensaje de error interno del servidor y redirigir a login.html
        res.send("<script>alert('Error interno del servidor.'); window.location.href = 'login.html';</script>");
    }
});

// Ruta para manejar las solicitudes de recuperación de contraseña
app.post('/recuperar-contrasena', async (req, res) => {
    let connection;
    try {
        const { correoElectronico, nuevaContraseña } = req.body;
        connection = await oracle.getConnection(dbConfig);
        // Verificar si el correo electrónico existe en la base de datos
        const result = await connection.execute(
            `SELECT COUNT(*) FROM USUARIOS WHERE CORREO_ELECTRONICO = :correoElectronico`,
            [correoElectronico]
        );
        const usuarioExiste = result.rows[0][0] > 0;
        if (usuarioExiste) {
            // Si el usuario existe, actualizar su contraseña en la base de datos
            const hashedPassword = await hashPassword(nuevaContraseña);
            await connection.execute(
                `UPDATE USUARIOS SET CONTRASEÑA = :hashedPassword WHERE CORREO_ELECTRONICO = :correoElectronico`,
                [hashedPassword, correoElectronico]
            );
            // Realizar el commit para guardar los cambios en la base de datos
            await connection.commit();
            res.send('<script>alert("Contraseña actualizada exitosamente."); window.location.href = "login.html";</script>');
        } else {
            // Si el usuario no existe, mostrar un mensaje de error y redirigir a login.html
            res.send('<script>alert("El correo electrónico ingresado no está registrado."); window.location.href = "recuperar-contraseña.html";</script>');
        }
        await connection.close();
    } catch (error) {
        console.error(error);
        if (connection) {
            await connection.close();
        }
        res.status(500).send('<script>alert("Error interno del servidor."); window.location.href = "recuperar-contraseña.html";</script>');
    }
});

// Función para obtener el ID de usuario basado en el correo electrónico
async function obtenerIdUsuario(correoElectronico) {
    let connection;
    try {
        connection = await oracle.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT ID FROM USUARIOS WHERE CORREO_ELECTRONICO = :correoElectronico`,
            [correoElectronico]
        );
        if (result.rows.length > 0) {
            const userId = result.rows[0][0];
            return { success: true, userId };
        } else {
            return { success: false, message: 'Usuario no encontrado.' };
        }
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error interno del servidor.' };
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                console.error(error);
            }
        }
    }
}
// Ruta para manejar las solicitudes de carga de datos de usuario para edición
app.get('/editarPerfil', async (req, res) => {
    try {
        const { correoElectronico } = req.query;
        const idResult = await obtenerIdUsuario(correoElectronico);
        if (idResult.success) {
            const userId = idResult.userId;
            // Consultar la base de datos para obtener los datos del usuario
            const connection = await oracle.getConnection(dbConfig);
            const result = await connection.execute(
                `SELECT NOMBRE_COMPLETO, CORREO_ELECTRONICO FROM USUARIOS WHERE ID = :userId`,
                [userId]
            );
            await connection.close();
            if (result.rows.length > 0) {
                const nombreCompleto = result.rows[0][0];
                const correoElectronico = result.rows[0][1];
                res.send({ success: true, nombreCompleto, correoElectronico });
            } else {
                res.send({ success: false, message: 'Datos del usuario no encontrados.' });
            }
        } else {
            res.status(404).send({ success: false, message: 'Usuario no encontrado.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error interno del servidor.' });
    }
});

// Ruta para manejar las solicitudes de actualización de perfil
app.post('/editarPerfil', async (req, res) => {
    try {
        const { correoElectronico, nombreCompleto, nuevoCorreo } = req.body;
        const idResult = await obtenerIdUsuario(correoElectronico);
        if (idResult.success) {
            const userId = idResult.userId;
            // Actualizar los datos del usuario en la base de datos
            const connection = await oracle.getConnection(dbConfig);
            await connection.execute(
                `UPDATE USUARIOS SET NOMBRE_COMPLETO = :nombreCompleto, CORREO_ELECTRONICO = :nuevoCorreo WHERE ID = :userId`,
                [nombreCompleto, nuevoCorreo, userId]
            );
            await connection.commit();
            await connection.close();
            // Enviar un script de JavaScript para mostrar el mensaje de registro exitoso
            res.send('<script>alert("¡Perfil actualizado exitosamente!"); window.location.href = "principal.html";</script>');
        } else {
            res.send('<script>alert("Usuario no encontrado."); window.location.href = "editarPerfil.html";</script>');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error interno del servidor.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}`);
});