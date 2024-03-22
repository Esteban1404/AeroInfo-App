const oracledb = require('oracledb');

async function consultarTablas() {
    try {
        const connection = await oracledb.getConnection({
            user: 'AdminAeroInfo',
            password: 'Aeroinfo_LBD',
            connectString: 'localhost:1521/orcl' // Tu conexión
        });

        console.log("Conexión exitosa a la base de datos Oracle");

        // Consulta SQL para obtener la lista de tablas en la base de datos
        const result = await connection.execute(
            `SELECT table_name
             FROM user_tables`
        );

        console.log("Lista de tablas en la base de datos AeroInfo:");
        result.rows.forEach(row => {
            console.log(row[0]);
        });

        // Cerrar la conexión cuando hayas terminado de usarla
        await connection.close();
    } catch (error) {
        console.error("Error al conectar a la base de datos Oracle:", error);
    }
}
consultarTablas();
