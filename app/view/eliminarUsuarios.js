const oracledb = require('oracledb');

// Función para eliminar todos los usuarios de la base de datos
async function eliminarUsuarios() {
    try {
        // Establecer una conexión a la base de datos
        const connection = await oracledb.getConnection({
            user: 'AdminAeroInfo',
            password: 'Aeroinfo_LBD',
            connectString: 'localhost:1521/orcl'
        });

        // Ejecutar la instrucción SQL para eliminar todos los usuarios
        const result = await connection.execute(
            `DELETE FROM usuarios`
        );

        // Obtener el número de filas afectadas
        const numRowsAffected = result.rowsAffected;

        console.log(`Se han eliminado ${numRowsAffected} usuarios`);

        // Confirmar la transacción
        await connection.commit();

        // Cerrar la conexión
        await connection.close();
        console.log('Conexión cerrada');
    } catch (error) {
        console.error('Error al eliminar usuarios:', error);
    }
}

// Llamar a la función para eliminar usuarios
eliminarUsuarios();
