const express = require('express');
const session=require('express-session');
const bodyParser = require('body-parser');
const oracle = require('oracledb');
const path = require('path');
const bcrypt = require('bcryptjs');
const oracleDb = require('oracledb');
const { agregarVuelo, editarVuelo, borrarVuelo } = require('./funciones'); // Importar las funciones agregarVuelo y editarVuelo

const app = express();
const port = 3000;


// Middleware de análisis de cuerpo de solicitud
app.use(express.static(path.join(__dirname, '..', 'view')));
app.use(express.static(path.join(__dirname, '..', 'assets')));
app.use(express.static(path.join(__dirname, '..', 'css')));
app.use(session({secret:'mi_secreto',resave:false,saveUninitialized:true,}));

// Definir la carpeta para servir archivos estáticos
const carpetaImagenes = path.join(__dirname, '..', 'imagenes');
app.use('/imagenes', express.static(carpetaImagenes));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de la base de datos Oracle
const dbConfig = {
    user: 'AdminAeroInfo',
    password: 'Aeroinfo_LBD',
    connectString: 'localhost:1521/orcl'
};

//INICIO DE IMPLEMENTACIÓN SISTEMA DE USUARIOS//


// Función para enviar un popup de registro exitoso al cliente
function registroExitoso(res) {
    res.send('<script>alert("¡Registro exitoso!"); window.location.href = "Inicio_Registro.html";</script>');
}

// Función para hacer hash de la contraseña
async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        console.error('Error al hacer hash de la contraseña:', error);
        throw error; 
    }
}

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
            res.status(400).send('<script>alert("El correo electrónico ya está registrado."); window.location.href = "Inicio_Registro.html";</script>');
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
            res.send('<script>alert("¡Registro exitoso!"); window.location.href = "Inicio_Registro.html";</script>');
        }
    } catch (error) {
        console.error(error);
        if (connection) {
            await connection.close();
        }
        // Enviar un mensaje de error al cliente en caso de error
        res.status(500).send('<script>alert("Error interno del servidor."); window.location.href = "Inicio_Registro.html";</script>');
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
            const usuario = result.rows[0]; 
            const nombreUsuario = usuario[0];
            const hashedPassword = usuario[1]; 
            // Verificar la contraseña
            const passwordMatch = await bcrypt.compare(contraseña, hashedPassword);
            if (passwordMatch) {
                // Obtener el ID del usuario
                const idResult = await obtenerIdUsuario(correoElectronico);
                if (idResult.success) {
                    const userId = idResult.userId;
                    req.session.userId=userId;
                    console.log('ID del usuario:', userId);
                } else {
                    console.error('Usuario no encontrado.');
                }
                // Enviar un script de JavaScript para mostrar el mensaje de bienvenida y redirigir a principal.html
                res.send(`<script>alert('¡Bienvenid@ ${nombreUsuario}!'); window.location.href = 'home.html';</script>`);
            } else {
                // Si las credenciales son incorrectas, enviar un script de JavaScript para mostrar un mensaje de error y redirigir a login.html
                res.send("<script>alert('Correo electrónico o contraseña incorrectos.'); window.location.href = 'Inicio_Registro.html';</script>");
            }
        } else {
            // Si el usuario no existe, enviar un script de JavaScript para mostrar un mensaje de error y redirigir a login.html
            res.send("<script>alert('Correo electrónico o contraseña incorrectos.'); window.location.href = 'Inicio_Registro.html';</script>");
        }
        await connection.close();
    } catch (error) {
        console.error(error);
        // Enviar un script de JavaScript para mostrar un mensaje de error interno del servidor y redirigir a login.html
        res.send("<script>alert('Error interno del servidor.'); window.location.href = 'Inicio_Registro.html';</script>");
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
            res.send('<script>alert("Contraseña actualizada exitosamente."); window.location.href = "Inicio_Registro.html";</script>');
        } else {
            // Si el usuario no existe, mostrar un mensaje de error y redirigir a login.html
            res.send('<script>alert("El correo electrónico ingresado no está registrado."); window.location.href = "olvido_contraseña.html";</script>');
        }
        await connection.close();
    } catch (error) {
        console.error(error);
        if (connection) {
            await connection.close();
        }
        res.status(500).send('<script>alert("Error interno del servidor."); window.location.href = "olvido_contraseña.html";</script>');
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
            res.send('<script>alert("¡Perfil actualizado exitosamente!"); window.location.href = "home.html";</script>');
        } else {
            res.send('<script>alert("Usuario no encontrado."); window.location.href = "editarPerfil.html";</script>');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error interno del servidor.' });
    }
});
//parte de douglas
// Conexión a la base de datos
oracleDb.getConnection(dbConfig)
    .then(connection => {
        console.log('Conexión exitosa a la base de datos Oracle');

        // Aquí se integran las rutas para vuelos
        app.post('/nuevoVuelo', async (req, res) => {
            try {
                await agregarVuelo(req, res, connection);
                await connection.commit();
            } catch (error) {
                console.error('Error al agregar vuelo:', error.message);
                if (connection) {
                await connection.rollback();
            } res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "agregarVuelos.html";</script>');
            }
        });

        app.post('/editarVuelo', async (req, res) => {
            try {
                await editarVuelo(req, res, connection);
                await connection.commit();
            } catch (error) {
                console.error('Error al editar vuelo:', error.message);
                if (connection) {
                await connection.rollback();
            } res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "agregarVuelos.html";</script>');
            }
        });

        app.post('/borrarVuelo', async (req, res) => {
            try {
                await borrarVuelo(req, res, connection);
                await connection.commit();
            } catch (error) {
                console.error('Error al borrar vuelo:', error.message);
                if (connection) {
                await connection.rollback();
            } res.status(500).send('<script>alert("Error interno del servidor"); window.location.href = "agregarVuelos.html";</script>');
        }
        });
    })
    .catch(err => console.error('Error de conexión a la base de datos Oracle:', err));
//fin de parte de douglas

//Parte de Esteban

//  Implementacion para buscar el vuelo por medio del codigo de vuelo
app.get('/vuelos', async (req, res) => {
    const idVuelo = req.query.idVuelo;
    try {
        // Realizar la consulta en la base de datos para obtener la información del vuelo por su ID
        const connection = await oracleDb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM VUELO WHERE Numero_Vuelo = :id`,
            [idVuelo]
        );
        if (result.rows.length > 0) {
            // Si se encuentra el vuelo, crear una tabla HTML con los datos del vuelo
            const vuelo = result.rows[0];
            const vueloHTML = `
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Destino</th>
                        <th>Estado</th>
                        <th>Fecha de Salida</th>
                        <th>Fecha de Llegada</th>
                    </tr>
                    <tr>
                        <td>${vuelo[0]}</td>
                        <td>${vuelo[1]}</td>
                        <td>${vuelo[2]}</td>
                        <td>${vuelo[3]}</td>
                        <td>${vuelo[4]}</td>
                    </tr>
                </table>
            `;
            // Enviar la tabla HTML como respuesta al cliente
            res.send(vueloHTML);
        } else {
            // Si no se encuentra el vuelo, enviar un mensaje de error al cliente
            res.status(404).send('<p>Vuelo no encontrado</p>');
        }
    } catch (error) {
        console.error('Error al buscar vuelo por ID:', error);
        // Enviar un mensaje de error interno del servidor al cliente
        res.status(500).send('<p>Error interno del servidor</p>');
    }
});

//  Implementacion para buscar el vuelo para reservar
app.get('/reserva', async (req, res) => {
    const destino = req.query.destino;
    const userId = req.session.userId;

    try {
        const connection = await oracleDb.getConnection(dbConfig);
        const result = await connection.execute(
            `BEGIN obtener_vuelos_por_destino(:destino, :cursor); END;`,
            {
                destino: destino,
                cursor: { type: oracleDb.CURSOR, dir: oracleDb.BIND_OUT }
            }
        );

        const cursor = result.outBinds.cursor;
        let vueloHTML = '';

        while (true) {
            const row = await cursor.getRow();
            if (!row) break;

            vueloHTML += `
                <div class="mb-3">
                    <label for="destino" class="form-label">Destino</label>
                    <input type="text" value="${row[1]}" name="destino" class="form-control" id="destino" readOnly>
                </div>
                <div class="mb-3">
                    <label for="fechaLlegada" class="form-label">Fecha LLegada</label>
                    <input type="text" value="${row[3]}" name="fechaLlegada" class="form-control" id="fechaLlegada" readOnly>
                </div>
                <div class="mb-3">
                    <label for="fechaSalida" class="form-label">Fecha Salida</label>
                    <input type="text" value="${row[2]}" name="fechaSalida" class="form-control" id="fechaSalida" readOnly>
                </div>
                <form id="formulario" action="/booking" method="POST">
                    <input type="hidden" value="${userId}" name="userId" class="form-control" id="userId" placeholder="Email">
                    <input type="hidden" value="${row[0]}" name="numero_vuelo" class="form-control" id="numero_vuelo">
                    <input type="hidden" value="${row[4]}" name="idTarifa" class="form-control" id="idTarifa">
                    <button type="submit" class="btn btn-primary">Reservar</button>
                </form>
            `;
        }

        await cursor.close();

        if (vueloHTML !== '') {
            res.send(vueloHTML);
        } else {
            res.status(404).send('<p>Vuelo no encontrado</p>');
        }
    } catch (error) {
        console.error('Error al buscar vuelo por destino:', error);
        res.status(500).send('<p>Error interno del servidor</p>');
    }
});



// Configurar la ruta para manejar la solicitud de reserva
app.post('/booking', async (req, res) => {
    try {
        const connection = await oracleDb.getConnection(dbConfig);
        console.log('Conexión exitosa a la base de datos Oracle');

        const { userId, numero_vuelo, idTarifa } = req.body;

        if (!userId || !numero_vuelo || !idTarifa) {
            await connection.close();
            return res.status(400).send('Todos los campos son obligatorios');
        }

        const existingReservation = await connection.execute(
            `BEGIN
                 :totalReservas := validar_reserva_existente(:userId, :numero_vuelo);
             END;`,
            {
                userId: userId,
                numero_vuelo: numero_vuelo,
                totalReservas: { dir: oracleDb.BIND_OUT, type: oracleDb.NUMBER }
            }
        );
        
        const totalReservas = existingReservation.outBinds.totalReservas;
        
        if (totalReservas > 0) {
            // Si ya existe una reserva para el usuario y el vuelo, informar al usuario y evitar la reserva
            await connection.close();
            return res.send('<script>alert("¡Reserva Existente!"); window.location.href = "/reservas.html";</script>');
        }

        // Ejecutar la consulta SQL para insertar los datos del formulario en la base de datos
        const result = await connection.execute(
            `INSERT INTO RESERVA (ID_PASAJERO, NUMERO_VUELO, ID_TARIFA) 
             VALUES (:userId, :numero_vuelo, :idTarifa)`,
            [userId, numero_vuelo, idTarifa]
        );

        // Commit de la transacción
        await connection.commit();

        // Liberar la conexión
        await connection.close();

        // Enviar una respuesta al cliente para indicar que la reserva se realizó con éxito
        res.send('<script>alert("¡Reserva realizada con éxito!"); window.location.href = "/reservas.html";</script>');
    } catch (error) {
        console.error('Error al procesar la reserva:', error);
        // Enviar un mensaje de error interno del servidor al cliente
        res.status(500).send('<p>Error interno del servidor al procesar la reserva</p>');
    }
});

app.get('/historial', async (req, res) => {
    const userId = req.session.userId;   

    try {
        // Realizar la consulta en la base de datos para obtener la información del vuelo por su ID
        const connection = await oracleDb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT 
            p.Nombre AS Nombre_Pasajero,
            v.Destino,
            v.Hora_Salida AS Fecha_Salida,
            v.Hora_Llegada AS Fecha_Llegada,
            t.Tipo_Tarifa AS Tarifa
        FROM 
            Reserva r
        JOIN 
            Pasajero p ON r.ID_Pasajero = p.ID_Pasajero
        JOIN 
            Vuelo v ON r.Numero_Vuelo = v.Numero_Vuelo
        JOIN 
            Tarifas t ON r.ID_Tarifa = t.ID_Tarifa
            Where p.ID_PASAJERO= :userId
        `,
            [userId]
        );
        
        if (result.rows.length > 0) {
            let vueloHTML = ''; // Inicializar una cadena para almacenar el HTML de todos los vuelos
            result.rows.forEach(vuelo => {
                vueloHTML += `
                <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Nombre Pasajero: ${vuelo[0]}</h5>
                        <p class="card-text">Destino: ${vuelo[1]}</p>
                        <p class="card-text">Fecha Salida: ${vuelo[2]}</p>
                        <p class="card-text">Fecha Llegada: ${vuelo[3]}</p>
                        <p class="card-text">Tipo Tarifa: ${vuelo[4]}</p>
                    </div>
                </div>
            </div>
                `;
            });

            vueloHTML += '</ul>';

            // Enviar la tabla HTML como respuesta al cliente
            res.send(vueloHTML);
        } else {
            // Si no se encuentra ninguna reserva, enviar un mensaje indicando que no se encontraron vuelos
            res.send('<p>No se encontraron vuelos en el historial</p>');
        }
    } catch (error) {
        console.error('Error al buscar vuelo por ID:', error);
        // Enviar un mensaje de error interno del servidor al cliente
        res.status(500).send('<p>Error interno del servidor</p>');
    }
});



//FIN DE IMPLEMENTACIÓN SISTEMA

//IMPLEMENTACION DE REPORTE
// Ruta para obtener los vuelos por mes
app.get('/api/vuelos', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT EXTRACT(MONTH FROM FECHA_SALIDA) AS MES, COUNT(*) AS TOTAL_VUELOS
             FROM VUELOS
             GROUP BY EXTRACT(MONTH FROM FECHA_SALIDA)
             ORDER BY MES`
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al consultar la base de datos");
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});