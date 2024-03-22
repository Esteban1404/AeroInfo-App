const oracledb = require('oracledb');

async function conectarABaseDeDatos() {
    try {
        const connection = await oracledb.getConnection({
            user: 'AdminAeroInfo',
            password: 'Aeroinfo_LBD',
            connectString: 'localhost:1521/orcl' // Nuestra conexión
        });

        console.log("Conexión exitosa a la base de datos Oracle");

        // Cerrar la conexión cuando haya terminado de usarla
        await connection.close();
    } catch (error) {
        console.error("Error al conectar a la base de datos Oracle:", error);
    }
}
conectarABaseDeDatos();

