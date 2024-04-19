// importa la librería oracledb
const oracledb = require('oracledb');

// Función para eliminar usuarios de la tabla USUARIOS
async function eliminarUsuarios() {
    let connection;
    try {
        // Establecer la conexión a la base de datos
        connection = await oracledb.getConnection({
            user: 'AdminAeroInfo',
            password: 'Aeroinfo_LBD',
            connectString: 'localhost:1521/orcl'
        });

        // Consulta SQL para eliminar usuarios
        const query = `DELETE FROM USUARIOS`;

        // Ejecutar la consulta SQL
        const result = await connection.execute(query);

        // Verificar si se han eliminado usuarios
        if (result.rowsAffected && result.rowsAffected > 0) {
            console.log(`${result.rowsAffected} usuarios eliminados correctamente.`);
        } else {
            console.log('No se eliminaron usuarios.');
        }
    } catch (error) {
        console.error('Error al eliminar usuarios:', error);
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            try {
                await connection.close();
                console.log('Conexión cerrada correctamente.');
            } catch (error) {
                console.error('Error al cerrar la conexión:', error);
            }
        }
    }
}

// Llamar a la función para eliminar usuarios
eliminarUsuarios();
