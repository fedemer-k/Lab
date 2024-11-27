//Para cambiar eso se tiene que obtener otra vista que seria "Aprobar Solicitudes"
        //Esta vista solo cambiara el valor de reservado a otro.

    //Por ultimo se tiene la vista "Ver turnos"
        //esta vista la pueden ver los medicos (solo sus turnos)
        //Tambien sera visible por los administradores (todos los turnos)

    //Implementacion de feriados.

    //Implementacion de excepciones de horario. (vacaciones, x problemas)

    //VERSION 0.9 FUNCIONAL EN UNA CLINICA
    
    //Retocar el singup, para que el usuario pueda meter una foto de dni.

    //Modificar la agenda de un medico para que se pueda limitar en rango de dias.
    //Puede tener mas de una agenda, ya que pueden ser de diferentes dias,
        //y ensima con diferentes horarios.

    //VERSION 1.0 FUNCIONAL EN UNA CLINICA COMPLETO

    //Intentar entender y planificar el uso de multiples clinicas.
        //Alta, modificacion y desactivacion de clinica.
        //Asignacion de medicos y administradores a una clinica
        //Retocar las solicitudes/turnos para que pertenezcan a una clinica.

    
    //Hay que meter filtros del demonio

    //VERSION 1.8

    //Que se pueda pasar un turno de una clinica a otra (a otro medico)

    //VERSION 2.0 RETAIL

//#region Mysql2
const mysql = require("mysql2/promise");
const cnxConfig = { 
	host:     process.env.DB_HOST, 
	database: process.env.DB_DATABASE, 
	user:     process.env.DB_USER, 
	password: process.env.DB_PASS
};
//#endregion

async function getEmitirSolicitud(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const {id_especialidad, id_medico} = req.body;

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        //query para buscar dicho medico
        const [medico] = await connection.execute(` 
            SELECT u.id_usuario, m.id_medico, u.nombres, u.apellidos, u.dni, u.correo, u.fecha_alta, m.activo
            FROM usuario u 
            JOIN medico m 
            ON u.id_usuario = m.id_usuario
            WHERE m.activo = 1
            AND m.id_medico = ?;`,
            [id_medico]
        );

        if (medico.length === 0){
            return res.status(403).render("error", {user: req.user, error: "Medico no encontrado"});
        }

        // Obtengo la especialidad enviada
        const [especialidad] = await connection.execute(`
            SELECT id_especialidad, nombre_especialidad
            FROM especialidad
            WHERE id_especialidad = ?;`,
            [id_especialidad]
        );

        if (especialidad.length === 0){
            return res.status(403).render("error", {user: req.user, error: "Especialidad no encontrado"});
        }

        //obtengo todos sus bloques horarios
        const [bloques] = await connection.execute(` 
            SELECT *
            FROM bloque_horario 
            WHERE id_medico = ?;`,
            [id_medico]
        );

        //Tomo todas sus solicitudes de consulta
        const [consultas] = await connection.execute(` 
            SELECT id_solicitud_consulta, id_usuario, id_medico, id_especialidad, CONVERT_TZ(horario, @@session.time_zone, '${process.env.TIME_ZONE}')  AS horario, aceptada
            FROM solicitud_consulta 
            WHERE id_medico = ?`,
            [id_medico]
        );

        console.log(consultas);

        //creo un arreglo para agregar bloques horarios pertenecientes a consultas solicitadas
        bloques_turnos = [];

        consultas.forEach(function(consulta){
            // Quitar los milisegundos y la "Z" del final
            let fechaStart = consulta.horario.toISOString().split('.')[0];

            // Convertir fechaStart a objeto Date
            let fechaEnd = new Date(consulta.horario);
            
            // Agregar 30 minutos
            fechaEnd.setMinutes(fechaEnd.getMinutes() + 30);
            
            // Formatear fechaEnd a "YYYY-MM-DDTHH:MM:SS"
            fechaEnd = fechaEnd.toISOString().split('.')[0];

            let bloque_horario = { 
                title: "TURNO OCUPADO", 
                url: "", 
                start: fechaStart,
                end: fechaEnd,
                color: 'red'
            }

            bloques_turnos.push(bloque_horario);
        });

        //console.log(bloques_turnos);

        //creo el arreglo de sus bloques horarios y los preparo para la vista.
        bloques_horarios = [];

        bloques.forEach(function(bloque){ 
            // Dividir la cadena en partes usando ":" como separador 
            let partes = bloque.hora.split(':'); 
            
            // Obtener la hora, los minutos y los segundos 
            let hora = partes[0]; 
            let minutos = partes[1]; 

            let horaFin = hora;
            let minutosFin = minutos;

            //Si empieza a las y media la hora debe subir y se s
            if(minutos == 30){
                horaFin = horaFin + 1;
                minutosFin = 0;
            }else{
                minutosFin= 30;
            }

            let bloque_horario = { 
                title: bloque.descripcion, 
                url: `solicitud/emitir/${id_especialidad}E${id_medico}M`, 
                start: "2024-01-0" + bloque.id_dia + "T" + hora + ":" + minutos + ":00", 
                end: "2024-01-0" + bloque.id_dia + "T" + horaFin + ":" + minutosFin + ":00",
                color: 'blue'
            }

            bloques_horarios.push(bloque_horario);
        });

        return res.render("turno/solicitud", { 
            user: req.user, 
            medico : medico[0], 
            bloques_horarios: bloques_horarios, 
            bloques_turnos: bloques_turnos, 
            id_medico: id_medico, 
            especialidad: especialidad[0]
        });
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }


    res.render("turno/solicitud", {user: req.user});
}

async function showAddRequest(req, res){
    // Temporalmente solo podran emitir una solicitud todo usuario registrado.
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }

    //Llenado variables a utilizar
    const {bloque} = req.params;

    // Dividir la cadena usando "M" para separar la fecha y hora del resto
    let partes = bloque.split('M');

    // Obtener id_especialidad y id_usuario
    let idEspecialidadYMedico = partes[0].split('E');
    let id_especialidad = idEspecialidadYMedico[0];
    let id_medico = idEspecialidadYMedico[1];
    
    // Obtener fecha y hora
    let fechaYHora = partes[1]; //Esto es por si necesito la fecha y hora juntas.
    let partesFechaYHora = partes[1].split('T');
    let fecha = partesFechaYHora[0];
    let hora = partesFechaYHora[1];

    let opciones = { weekday: 'long'};
    let diaNombre = new Date(fecha).toLocaleDateString('es-ES', opciones);

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        //Busco al medico, si no lo encuentro lanzo error.
        const [medico] = await connection.execute(` 
            SELECT m.id_medico, u.nombres, u.apellidos
            FROM usuario u 
            JOIN medico m 
            ON u.id_usuario = m.id_usuario
            WHERE m.activo = 1
            AND m.id_medico = ?;`,
            [id_medico]
        );

        if (medico.length === 0){
            return res.redirect(`/?error=Medico no encontrado`);
        }

        // Obtengo la especialidad enviada
        const [especialidad] = await connection.execute(`
            SELECT id_especialidad, nombre_especialidad
            FROM especialidad
            WHERE id_especialidad = ?;`,
            [id_especialidad]
        );

        if (especialidad.length === 0){
            return res.redirect(`/?error=Especialidad no encontrada`);
        }

        //Me fijo si la solicitud, ya fue enviada con anterioridad
        const [consulta] = await connection.execute(` 
            SELECT * 
            FROM solicitud_consulta 
            WHERE horario = ?
            AND id_medico = ?`,
            [new Date(fechaYHora), id_medico]
        );

        if(consulta.length !== 0){
            return res.redirect(`/?error=Lo sentimos, el medico ${medico[0].nombres} ${medico[0].apellidos} esta ocupado para el dia ${fechaYHora} (${diaNombre}) y la hora ${hora}`);
        }

        const datos = {
            especialidad : especialidad[0],
            medico: medico[0],
            fechaYHora : fechaYHora,
            fecha: fecha,
            hora: hora,
            diaNombre: diaNombre
        }

        return res.render("turno/confirmarSolicitud", {user: req.user, datos : datos});

    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function addRequest(req, res){
    // Temporalmente solo podran emitir una solicitud todo usuario registrado.
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }

    //Llenado variables a utilizar
    const {id_especialidad, id_medico, fechaYHora, fecha, hora, diaNombre} = req.body;


    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        //#region Busco al medico, si no lo encuentro lanzo error.
        const [medico] = await connection.execute(` 
            SELECT m.id_medico, u.nombres, u.apellidos
            FROM usuario u 
            JOIN medico m 
            ON u.id_usuario = m.id_usuario
            WHERE m.activo = 1
            AND m.id_medico = ?;`,
            [id_medico]
        );

        if (medico.length === 0){
            return res.redirect(`/?error=Medico no encontrado`);
        }
        //#endregion

        //#region Busco la especialidad solicitada, si no la encuentro lanzo error
        const [especialidad] = await connection.execute(`
            SELECT id_especialidad, nombre_especialidad
            FROM especialidad
            WHERE id_especialidad = ?;`,
            [id_especialidad]
        );

        if (especialidad.length === 0){
            return res.redirect(`/?error=Especialidad no encontrada`);
        }
        //#endregion

        //#region Busco que el medico tenga matricula para ejercer esa especialidad.
        const [matricula] = await connection.execute(`
            SELECT
                me.id_medico,
                e.id_especialidad,
                e.nombre_especialidad
            FROM
                medico me
            JOIN
                matricula ma
                ON me.id_medico = ma.id_medico
            JOIN
                especialidad e
                ON ma.id_especialidad = e.id_especialidad
            WHERE
                ma.activo = 1 AND e.id_especialidad = ? AND me.id_medico = ?;
            ;`,[id_especialidad, id_medico]
        );

        if (matricula.length === 0){
            return res.redirect(`/?error=Este medico no tiene esta matricula`);

        }
        //#endregion

        //#region Busco si el medico esta disponible, si no lo esta lanzo error.
        const [consulta] = await connection.execute(` 
            SELECT * 
            FROM solicitud_consulta 
            WHERE horario = ?
            AND id_medico = ?`,
            [new Date(fechaYHora), id_medico]
        );

        if(consulta.length !== 0){
            return res.redirect(`/?error=Lo sentimos, el medico ${medico[0].nombres} ${medico[0].apellidos} esta ocupado para el dia ${fechaYHora} (${diaNombre}) y la hora ${hora}`);
        }
        //#endregion

        //Agrego la solicitud de turno entrante
        const [result] = await connection.execute(` 
            INSERT INTO solicitud_consulta 
            (id_usuario, id_medico, id_especialidad, horario) 
            VALUES (?, ?, ?, ?);`,
            [req.user.id_usuario, id_medico, id_especialidad, new Date(fechaYHora)]
        );

        if(result.affectedRows === 1){
            return res.redirect(`/?exito=El usuario  ${req.user.nombres} ${req.user.apellidos} acaba de solicitar un turno de ${especialidad[0].nombre_especialidad} para el dia ${fecha} y la hora ${hora}`);
        }else{
            return res.status(500).render("error", {user: req.user, error: `No se pudo agregar el bloque de horario`});
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

//Gestion de horario de un medico.

async function getShowRange(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";
    const {id_medico} = req.params; 

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        //query para buscar dicho medico
        const [medico] = await connection.execute(` 
            SELECT u.id_usuario, m.id_medico, u.nombres, u.apellidos, u.dni, u.correo, u.fecha_alta, m.activo
            FROM usuario u 
            JOIN medico m 
            ON u.id_usuario = m.id_usuario
            WHERE m.activo = 1
            AND m.id_medico = ?;`,
            [id_medico]
        );

        if (medico.length === 0){
            return res.status(403).render("error", {user: req.user, error: "Medico no encontrado"});
        }

        //obtengo todos sus bloques horarios
        const [bloques] = await connection.execute(` 
            SELECT *
            FROM bloque_horario 
            WHERE id_medico = ?;`,
            [id_medico]
        );

        //creo el arreglo de sus bloques horarios y los preparo para la vista.
        bloques_horarios = [];

        bloques.forEach(function(bloque){ 
            // Dividir la cadena en partes usando ":" como separador 
            let partes = bloque.hora.split(':'); 
            
            // Obtener la hora, los minutos y los segundos 
            let hora = partes[0]; 
            let minutos = partes[1]; 

            let horaFin = hora;
            let minutosFin = minutos;

            //Si empieza a las y media la hora debe subir y se s
            if(minutos == 30){
                horaFin = horaFin + 1;
                minutosFin = 0;
            }else{
                minutosFin= 30;
            }

            let bloque_horario = { 
                title: bloque.descripcion, 
                url: `/solicitud/rango/eliminar/${id_medico}M2024-01-0${bloque.id_dia}T${bloque.hora}`, 
                start: "2024-01-0" + bloque.id_dia + "T" + hora + ":" + minutos + ":00", 
                end: "2024-01-0" + bloque.id_dia + "T" + horaFin + ":" + minutosFin + ":00",
                color: 'blue'
            }

            bloques_horarios.push(bloque_horario);
        });

        return res.render("turno/rangoHorario", { user: req.user, medico : medico[0], bloques_horarios: bloques_horarios, exito: exito});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function addBlock(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const {bloque} = req.params;

    // Dividir la cadena usando "M" como separador
    let partes = bloque.split('M');

    // Obtener la primera parte
    let id_medico = partes[0];

    // Obtener la segunda parte (fecha y hora)
    let fechaHora = partes[1];

    // Dividir la segunda parte para obtener la fecha y la hora
    let partesFechaHora = fechaHora.split('T');
    let fecha = partesFechaHora[0];
    let hora = partesFechaHora[1];
    let diaNumero = fecha.split('-')[2];

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        // Obtengo al usuario
        const [usuario] = await connection.execute(
            `SELECT u.id_usuario, u.nombres, u.apellidos
            FROM usuario u
            JOIN medico m
            ON u.id_usuario = m.id_usuario
            WHERE m.id_medico = ?
            AND m.activo = 1`, 
            [id_medico] 
        );

        if(usuario.affectedRows === 0){
            return res.status(500).render("error", {user: req.user, error: `No se pudo encontrar el medico`});
        }
            
        //busco el dia de la semana
        const [diaNombre] = await connection.execute(` 
            SELECT id_dia, dia_semana
            FROM dia
            WHERE id_dia = ?;`,
            [diaNumero] 
        );

        //inserto el bloque de horario
        const [result] = await connection.execute( 
            `INSERT INTO bloque_horario 
            (id_medico, id_dia, hora, descripcion) 
            VALUES (?, ?, ?, ?);`, 
            [id_medico, diaNombre[0].id_dia, hora, 'turno asignado'] 
        ); 

        if(result.affectedRows === 1){
            return res.redirect(`/solicitud/rango/${id_medico}?exito=Al usuario  ${usuario[0].nombres} ${usuario[0].apellidos} se le agrego el bloque del dia ${diaNombre[0].dia_semana} y la hora ${hora}`);
        }else{
            return res.status(500).render("error", {user: req.user, error: `No se pudo agregar el bloque de horario`});
        }

    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function subtractBlock(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const {bloque} = req.params;

    // Dividir la cadena usando "M" como separador
    let partes = bloque.split('M');

    // Obtener la primera parte
    let id_medico = partes[0];

    // Obtener la segunda parte (fecha y hora)
    let fechaHora = partes[1];

    // Dividir la segunda parte para obtener la fecha y la hora
    let partesFechaHora = fechaHora.split('T');
    let fecha = partesFechaHora[0];
    let hora = partesFechaHora[1];
    let diaNumero = fecha.split('-')[2];

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        // Obtengo al usuario
        const [usuario] = await connection.execute(
            `SELECT u.id_usuario, u.nombres, u.apellidos
            FROM usuario u
            JOIN medico m
            ON u.id_usuario = m.id_usuario
            WHERE m.id_medico = ?
            AND m.activo = 1`, 
            [id_medico] 
        );

        if(usuario.affectedRows === 0){
            return res.status(500).render("error", {user: req.user, error: `No se pudo encontrar el medico`});
        }

        //busco el dia de la semana
        const [diaNombre] = await connection.execute(` 
            SELECT id_dia, dia_semana
            FROM dia
            WHERE id_dia = ?;`,
            [diaNumero] 
        );

        //elimino el bloque de horario
        const [result] = await connection.execute(`
            DELETE FROM bloque_horario 
            WHERE id_medico = ?
            AND hora = ?
            AND id_dia = ?;`, 
            [id_medico, hora, diaNumero] 
        ); 

        if(result.affectedRows === 1){
            res.redirect(`/solicitud/rango/${id_medico}?exito=Al usuario  ${usuario[0].nombres} ${usuario[0].apellidos} se le elimino el bloque del dia ${diaNombre[0].dia_semana} y la hora ${hora}`);
        }else{
            return res.status(500).render("error", {user: req.user, error: `No se pudo eliminar el bloque de horario`});
        }

    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

module.exports = {
    getEmitirSolicitud,
    showAddRequest,
    addRequest,
    getShowRange,
    addBlock,
    subtractBlock
};