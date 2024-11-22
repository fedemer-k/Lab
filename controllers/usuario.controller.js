//#region Mysql2
const mysql = require("mysql2/promise");
const cnxConfig = { 
    host:     'bahncy9cfv5sc1wycsii-mysql.services.clever-cloud.com', 
    database: 'bahncy9cfv5sc1wycsii', 
    user:     'uppjvqpmklnvhjzu', 
    password: 'xbKyu18VPzmF2fEnVFuc'
};
// const cnxConfig = { 
//     host:     'localhost', 
//     database: 'labiiac', 
//     user:     'root', 
//     password: '1231233'
// };
//#endregion
//#region UUID
// generador de id unicas
const uuid = require("uuid");
//#endregion
//#region bcryptjs
//generador de hash con salt incluida
//!!! WARN !!! bcryptjs solo usa JS, solo debe usarse con propocitos de desarollo.
const bcrypt = require("bcryptjs");
//#endregion
//#region JsonWebToken (jose)
//Sirve para crear un token y enviarlo al usuario para que el lo retorne adjuntado a su proxima peticion.
const jose = require('jose');
//#endregion

async function getGestion(req, res){ //VER 5.0 FALTA AGREGAR GESTION ESPECIALIDAD Y MATRICULAS
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";
    
    return res.render("usuario/seleccionarTipo", { user: req.user, exito:exito});
}

//gestion de usuarios

async function getAllUsers(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }
    
    let query = ` 
        SELECT u.id_usuario, u.nombres, u.dni, u.correo, u.fecha_alta 
        FROM usuario u 
        LEFT JOIN administrador a ON u.id_usuario = a.id_usuario 
        LEFT JOIN medico m ON u.id_usuario = m.id_usuario 
        WHERE (a.id_usuario IS NULL OR a.activo = 0)
        AND (m.id_usuario IS NULL OR m.activo = 0); 
    `;
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        const [result] = await connection.execute(query);
        res.render("usuario/listar", { user: req.user, usuarios: result });
    }catch(err){
        res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

function showAddUser(req, res){ 
    // Verificación de seguridad: Si tenes sesion y no sos admin, no deberias agregar mas usuarios
    if(req.user && req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "Usted ya posee cuenta."});
    }
    
    return res.render("usuario/alta", { user: req.user});
}

async function addUser(req, res){ 
    // Verificación de seguridad: Si tenes sesion y no sos admin, no deberias agregar mas usuarios
    if(req.user && req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "Usted ya posee cuenta."});
    }

    const { dni, nombres, apellidos, correo, contrasena, fecha_nac,
        sexo, sexo_biologico, telefono, direccion 
    } = req.body;
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$\.%^&*-]).{8,}$/;
    
    if(!emailRegex.test(correo)){
        return res.status(403).render("error", {user: req.user, error: `Por favor, ingresa una dirección de correo electrónico válida. El usuario ${nombres} NO fue agregado.`});
    }
    if(!passwordRegex.test(contrasena)){
        return res.status(403).render("error", {user: req.user, error: `La contraseña debe tener al menos 8 caracteres, contener minimo una mayúscula, una minúscula, un número y un caracter especial. El usuario ${nombres} NO fue agregado.`});
    }
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        
        const [users] = await connection.execute("SELECT * FROM usuario WHERE correo = ?", [correo]);
        if (users.length > 0){
            return res.status(500).render("error", {user: req.user, error: `Usuario encontrado en la base de datos. El usuario ${nombres} NO fue agregado.`});
        }
        
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(contrasena, salt);

        const [result] = await connection.execute( 
            "INSERT INTO usuario (dni, nombres, apellidos, correo, contrasena, fecha_nac, sexo, sexo_biologico, telefono, direccion, fecha_alta) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
            [dni, nombres, apellidos, correo, hash, fecha_nac, sexo, sexo_biologico, telefono, direccion, new Date()]
        );
        
        if(result.affectedRows == 1){
            return res.redirect(`/`);
        }else{
            return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS. El usuario ${nombres} NO fue agregado.`});
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function showUpdateUser(req, res){
    const id_usuario = req.params.id_usuario;

    // Verificación de seguridad: Solo el administrador o el propio usuario pueden editar
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.id_usuario != id_usuario && req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        
        // Consulta el usuario por ID
        const [result] = await connection.execute("SELECT * FROM usuario WHERE id_usuario = ?", [id_usuario]);
        
        //Usuario no encontrado 
        if(result.length === 0){
            return res.status(404).render("error", {user: req.user, error: "Usuario no encontrado"});
        }
        
        const usuario = result[0];
        // Aquí transformo el valor de fecha_nac para el formato requerido (DATE no DATETIME)
        usuario.fecha_nac = usuario.fecha_nac.toISOString().split('T')[0];
        
        // Renderiza la página de edición del usuario 
        return res.render("usuario/editar", {user: req.user, usuario });
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function updateUser(req, res){
    const {
        id_usuario, dni, nombres, apellidos, correo, fecha_nac,
        sexo, sexo_biologico, telefono, direccion
    } = req.body;

    // Verificación de seguridad: Solo el administrador o el propio usuario pueden editar
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.id_usuario != id_usuario && req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        // Actualización del usuario
        const [result] = await connection.execute(
            `UPDATE usuario SET dni = ?, nombres = ?, apellidos = ?, correo = ?, fecha_nac = ?, sexo = ?, sexo_biologico = ?, telefono = ?, direccion = ? WHERE id_usuario = ?`, 
            [dni, nombres, apellidos, correo, fecha_nac, sexo, sexo_biologico, telefono, direccion, id_usuario]
        ); 
        
        if(result.affectedRows === 1){
            return res.redirect(`/`);
        }else{
            return res.status(500).render("error", {user: req.user, error: `ERROR. El usuario ${nombres} NO fue actualizado.`});
        }

    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

//gestion de administradores

async function getAllAdmin(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";

    //query para listar todos los administradores
    query = ` 
        SELECT u.id_usuario, u.nombres, u.dni, u.correo, u.fecha_alta 
        FROM usuario u 
        JOIN administrador a 
        ON u.id_usuario = a.id_usuario
        WHERE a.activo = 1; 
    `; 

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        const [result] = await connection.execute(query);
        return res.render("usuario/listarAdministrador", { user: req.user, usuarios: result, exito: exito});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function showAddAdmin(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";

    //consulta para tener todos los usuarios excepto los administradores
    let query = ` 
        SELECT u.id_usuario, u.nombres, u.dni, u.correo, u.fecha_alta 
        FROM usuario u 
        LEFT JOIN administrador a 
        ON u.id_usuario = a.id_usuario 
        WHERE a.id_usuario IS NULL
        OR a.activo = 0;
    `;

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        const [result] = await connection.execute(query);
        return res.render("usuario/altaAdministrador", { user: req.user, usuarios: result, exito: exito});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function addAdmin(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const {id_usuario} = req.params;

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        // Obtengo al usuario
        const [usuario] = await connection.execute(
            "SELECT id_usuario, nombres FROM usuario WHERE id_usuario = ?", 
            [id_usuario] 
        );
        
        // Verificar si el usuario ya es un administrador 
        const [administrador] = await connection.execute(
            "SELECT id_administrador FROM administrador WHERE id_usuario = ?", 
            [id_usuario] 
        );

        // Si es administrador, actualizar el campo Activo a 1 
        if (administrador.length > 0){
            const [result] = await connection.execute( 
                "UPDATE administrador SET activo = 1 WHERE id_usuario = ?", 
                [id_usuario] 
            ); 
            
            if(result.affectedRows === 1){ 
                return res.redirect(`/usuario/administrador/alta?exito=El usuario ${usuario[0].nombres} ahora es administrador`);
            }else{
                return res.status(500).send("Error al activar el administrador.");
            }
        }else{
            // Si no es administrador, insertar en la tabla de administrador 
            const [result] = await connection.execute( 
                "INSERT INTO administrador (id_usuario, activo) VALUES (?, 1)", 
                [id_usuario] 
            ); 
            
            if(result.affectedRows === 1){
                return res.redirect(`/usuario/administrador/alta?exito=El usuario ${usuario[0].nombres} ahora es administrador`);
            }else{
                return res.status(500).send("Error al asignar al usuario como administrador.");
            }
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function deactivateAdmin(req, res){
    const {id_usuario} = req.params;
    let connection;

    try{
        connection = await mysql.createConnection(cnxConfig);

        // Obtengo al usuario
        const [usuario] = await connection.execute(
            "SELECT id_usuario, nombres FROM usuario WHERE id_usuario = ?", 
            [id_usuario] 
        );

        //Verificar si el usuario es un administrador
        const [administrador] = await connection.execute(
            "SELECT id_administrador FROM administrador WHERE id_usuario = ?", [id_usuario]
        );

        if(administrador.length > 0){
            // Si es administrador, actualizar el campo Activo a 0
            const [result] = await connection.execute(
                "UPDATE administrador SET activo = 0 WHERE id_usuario = ?", [id_usuario]
            );
            if(result.affectedRows === 1){
                return res.redirect(`/usuario/administrador?exito=El usuario ${usuario[0].nombres} dejo de ser administrador`);
            }else{
                return res.status(500).send("Error al desactivar el administrador.");
            }
        }else{
            // Si no es administrador, mostrar un error
            return res.status(404).send("El usuario no es administrador.");
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

//gestion de medicos

async function getAllMedic(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";

    //query para listar todos los medicos
    query = ` 
        SELECT u.id_usuario, m.id_medico, u.nombres, u.dni, u.correo, u.fecha_alta 
        FROM usuario u 
        JOIN medico m 
        ON u.id_usuario = m.id_usuario
        WHERE m.activo = 1;
    `;

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        const [result] = await connection.execute(query);
        return res.render("usuario/listarMedico", { user: req.user, usuarios: result, exito: exito});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function showAddMedic(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";

    //consulta para tener todos los usuarios excepto los medicos
    let query = ` 
        SELECT u.id_usuario, u.nombres, u.dni, u.correo, u.fecha_alta 
        FROM usuario u 
        LEFT JOIN medico m 
        ON u.id_usuario = m.id_usuario 
        WHERE m.id_usuario IS NULL
        OR m.activo = 0;
    `;

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        const [result] = await connection.execute(query);
        return res.render("usuario/altaMedico", { user: req.user, usuarios: result, exito: exito});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function addMedic(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const {id_usuario} = req.params; 
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig); 
        
        // Obtengo al usuario
        const [usuario] = await connection.execute(
            "SELECT id_usuario, nombres FROM usuario WHERE id_usuario = ?", 
            [id_usuario] 
        );

        // Verificar si el usuario ya es un medico 
        const [medico] = await connection.execute(
            "SELECT id_medico FROM medico WHERE id_usuario = ?", 
            [id_usuario] 
        );

        // Si es médico, actualizar el campo Activo a 1 
        if (medico.length > 0){
            const [result] = await connection.execute( 
                "UPDATE medico SET activo = 1 WHERE id_usuario = ?", 
                [id_usuario] 
            ); 
            
            if(result.affectedRows === 1){ 
                return res.redirect(`/usuario/medico/alta?exito=El usuario ${usuario[0].nombres} ahora es medico`);
            }else{
                return res.status(500).send("Error al activar el médico.");
            }
        }else{
            // Si no es medico, insertar en la tabla de médicos 
            const [result] = await connection.execute( 
                "INSERT INTO medico (id_usuario, activo) VALUES (?, 1)", 
                [id_usuario] 
            ); 
            
            if(result.affectedRows === 1){
                return res.redirect(`/usuario/medico/alta?exito=El usuario ${usuario[0].nombres} ahora es medico`);
            }else{
                return res.status(500).send("Error al asignar al usuario como medico.");
            }
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function deactivateMedic(req, res) {
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }
    const {id_usuario} = req.params;
    let connection;

    try{
        connection = await mysql.createConnection(cnxConfig);

        // Obtengo al usuario
        const [usuario] = await connection.execute(
            "SELECT id_usuario, nombres FROM usuario WHERE id_usuario = ?", 
            [id_usuario] 
        );

        //Verificar si el usuario es un médico
        const [medico] = await connection.execute(
            "SELECT id_medico FROM medico WHERE id_usuario = ?", [id_usuario]
        );

        if(medico.length > 0){
            // Si es médico, actualizar el campo Activo a 0
            const [result] = await connection.execute(
                "UPDATE medico SET activo = 0 WHERE id_usuario = ?", [id_usuario]
            );
            if(result.affectedRows === 1){
                return res.redirect(`/usuario/medico?exito=El usuario ${usuario[0].nombres} dejo de ser medico`);
            }else{
                return res.status(500).send("Error al desactivar el médico.");
            }
        }else{
            // Si no es médico, mostrar un error
            return res.status(404).send("El usuario no es médico.");
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function getAllSpecialties(req, res){
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

        //#region Busco el medico que me mandaron, si no me enviaron/ no existe, lanzo error
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
        //#endregion

        //#region Cargo todas sus especialidades
        const [matriculas] = await connection.execute(`
            SELECT
                e.nombre_especialidad,
                ma.id_matricula,
                ma.matricula,
                ma.fecha_vencimiento,
                ma.activo
            FROM
                matricula ma
            JOIN
                especialidad e
                ON ma.id_especialidad = e.id_especialidad
            WHERE
                ma.id_medico = ?;
            `, [id_medico]
        );
        //#endregion

        //Se muestra una lista donde se encontraran todas las especialidades/matriculas de un medico especifico
        return res.render("usuario/listarMatricula", { user: req.user, medico : medico[0], matriculas: matriculas, exito: exito});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function showAddSpecialtyToMedic(req, res){
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

        //#region Busco el medico que me mandaron, si no me enviaron/ no existe, lanzo error
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
        //#endregion

        //#region Cargo todas las especialidades, si no existen especialidades, lanzo error
        const [especialidades] = await connection.execute(`
            SELECT id_especialidad, nombre_especialidad
            FROM especialidad`
        );

        if (especialidades.length === 0){
            return res.status(403).render("error", {user: req.user, error: "Primero debe crear especialidades, luego podra asignale especialidades a los medicos."});
        }
        //#endregion

        //Se muestra formulario para asignar una especialidad, matricula y fecha de vencimiento a un medico especifico.
        return res.render("usuario/asignarMatricula", { user: req.user, medico : medico[0], especialidades: especialidades, exito: exito});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function addSpecialtyToMedic(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";
    
    //Todo lo que me enviaron por post
    const { 
        id_especialidad, 
        matricula, 
        fecha_vencimiento, 
        activo
    } = req.body;

    //Lo que me enviaron en la url
    const {id_medico} = req.params; 

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        //#region Busco el medico que me mandaron, si no me enviaron/ no existe, lanzo error
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
        //#endregion

        //#region Busco la especialidad a cargar, si no me envian una valida, lanzo error
        const [especialidad] = await connection.execute(`
            SELECT id_especialidad, nombre_especialidad
            FROM especialidad e
            WHERE e.id_especialidad = ?`,
            [id_especialidad]
        );

        if (especialidad.length === 0){
            return res.status(403).render("error", {user: req.user, error: "La especialidad a agregar no existe en la base de datos."});
        }
        //#endregion

        //#region Reviso si el medico ya tiene esta especialidad, si la tiene, lanzo error 
        const [checkMatricula] = await connection.execute(`
            SELECT
                e.nombre_especialidad,
                ma.matricula,
                ma.fecha_vencimiento,
                ma.activo
            FROM
                matricula ma
            JOIN
                especialidad e
                ON ma.id_especialidad = e.id_especialidad
            WHERE
                ma.id_medico = ?
                AND e.id_especialidad = ?;
            `, [id_medico, id_especialidad]
        );

        if (checkMatricula.length === 1){
            return res.status(403).render("error", {user: req.user, error: `El medico ${medico[0].nombres} ${medico[0].apellidos} (${medico[0].dni}) ya tiene la especialidad ${checkMatricula[0].nombre_especialidad} y su matricula es: ${checkMatricula[0].matricula}`});
        }
        //#endregion

        //#region Reviso si la matricula ya fue asignada a otro medico, si la tiene otro, lanzo error.
        const [check2Matricula] = await connection.execute(`
            SELECT
                u.nombres,
                u.apellidos,
                u.dni,
                ma.matricula,
                e.nombre_especialidad
            FROM
                medico me
            JOIN
                matricula ma
                ON me.id_medico = ma.id_medico
            JOIN
                especialidad e
                ON ma.id_especialidad = e.id_especialidad
            JOIN
                usuario u 
                ON me.id_usuario = u.id_usuario
            WHERE
                ma.matricula = ?;
            `, [matricula]
        );

        if (check2Matricula.length === 1){
            return res.status(403).render("error", {user: req.user, error: `No se puede asignar la matricula '${matricula}' al medico ${medico[0].nombres} ${medico[0].apellidos} (${medico[0].dni}) porque el medico ${check2Matricula[0].nombres} ${check2Matricula[0].apellidos} (${check2Matricula[0].dni}) ya la tiene asignada. (especialidad:${check2Matricula[0].nombre_especialidad})`});
        }
        //#endregion

        //#region Se procede a agregar la especialidad
        const [result] = await connection.execute(`
            INSERT INTO matricula (id_medico, id_especialidad, matricula, fecha_vencimiento, activo)
            VALUES (?, ?, ?, ?, ?);
            `,[id_medico, id_especialidad, matricula, fecha_vencimiento, activo]
        );

        if(result.affectedRows == 1){
            return res.redirect(`/usuario/medico/matricula/${id_medico}/?exito=La especialidad ${especialidad[0].nombre_especialidad} fue asignada a ${medico[0].nombres} ${medico[0].apellidos} con exito`);
        }else{
            return res.status(500).render("error", {user: req.user, error: `No se puedo asignar la matricula.`});
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function alternateLicense(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";

    const {id_medico, id_matricula} = req.params;
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        //#region Busco el medico que me mandaron, si no me enviaron/ no existe, lanzo error
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
        //#endregion

        //#region Busco la matricula a modificar, si no exite, lanzo error
        const [matricula] = await connection.execute(`
            SELECT *
            FROM matricula m
            JOIN especialidad e
            ON m.id_especialidad = e.id_especialidad
            WHERE m.id_matricula = ?`,
            [id_matricula]
        );

        if (matricula.length === 0){
            return res.status(403).render("error", {user: req.user, error: `La matricula a modificar no existe en la base de datos.`});
        }
        //#endregion

        //invierto el valor de activo.
        let activoInvertido;
        let modificacion;
        if(matricula[0].activo == 0){
            activoInvertido = 1;
            modificacion = "Activada";
        }else{
            activoInvertido = 0;
            modificacion = "Desactivada";
        }

        //realizo el update donde solo modifico el campo activo.
        const [result] = await connection.execute(`
            UPDATE matricula
            SET activo = ?
            WHERE id_matricula = ?`,
            [activoInvertido, id_matricula]
        );

        if(result.affectedRows == 1){
            return res.redirect(`/usuario/medico/matricula/${id_medico}/?exito=La especialidad ${matricula[0].nombre_especialidad} del medico ${medico[0].nombres} ${medico[0].apellidos} fue ${modificacion} con exito`);
        }else{
            return res.status(403).render("error", {user: req.user, error: `No fue posible cambiar el estado de la especialidad para el medico ${medico[0].nombres} ${medico[0].apellidos}`});
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }

}

async function showPutLicense(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";

    const {id_medico, id_matricula} = req.params;
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        //#region Busco el medico que me mandaron, si no me enviaron/ no existe, lanzo error
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
        //#endregion

        // Busco la matricula a modificar, si no exite, lanzo error
        const [matricula] = await connection.execute(`
            SELECT *
            FROM matricula m
            JOIN especialidad e
            ON m.id_especialidad = e.id_especialidad
            WHERE m.id_matricula = ?`,
            [id_matricula]
        );

        if (matricula.length === 1){
            return res.render("usuario/editarMatricula", {user: req.user, medico: medico[0], matricula: matricula[0]});
        }else{
            return res.status(403).render("error", {user: req.user, error: `La matricula a modificar no existe en la base de datos.`});
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function putLicense(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const exito = req.query.exito ? req.query.exito : "";

    const {id_medico, id_matricula} = req.params;
    const {matricula, fecha_vencimiento} = req.body;
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);

        //#region Busco el medico que me mandaron, si no me enviaron/ no existe, lanzo error
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
        //#endregion

        //#region Busco la matricula a modificar, si no exite, lanzo error
        const [checkMatricula] = await connection.execute(`
            SELECT *
            FROM matricula m
            JOIN especialidad e
            ON m.id_especialidad = e.id_especialidad
            WHERE m.id_matricula = ?`,
            [id_matricula]
        );

        if (checkMatricula.length === 0){
            return res.status(403).render("error", {user: req.user, error: `La matricula a modificar no existe en la base de datos.`});
        }
        //#endregion

        //realizo el update donde solo modifico la matricula y la fecha de vencimiento.
        const [result] = await connection.execute(`
            UPDATE matricula
            SET matricula = ?, fecha_vencimiento = ?
            WHERE id_matricula = ?`,
            [matricula, fecha_vencimiento, id_matricula]
        );

        if(result.affectedRows == 1){
            return res.redirect(`/usuario/medico/matricula/${id_medico}/?exito=La especialidad ${checkMatricula[0].nombre_especialidad} del medico ${medico[0].nombres} ${medico[0].apellidos} fue modificada con exito`);
        }else{
            return res.status(403).render("error", {user: req.user, error: `No fue posible modificar la matricula del medico ${medico[0].nombres} ${medico[0].apellidos}`});
        }
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }

}

//gestion de especialidades

async function showSpecialties(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig); 
        
        // Obtengo las especialidades
        const [especialidades] = await connection.execute(`
            SELECT id_especialidad, nombre_especialidad
            FROM especialidad`
        );

        return res.render("usuario/listarEspecialidad", {user: req.user, especialidades: especialidades});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function showAddSpecialties(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    return res.render("usuario/altaEspecialidad", {user: req.user});
}

async function addSpecialties(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const {nombre_especialidad} = req.body;
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig); 
        
        // Busco si la especialidad ya existe
        const [especialidad] = await connection.execute(`
            SELECT id_especialidad, nombre_especialidad 
            FROM especialidad
            WHERE nombre_especialidad = ?`,
            [nombre_especialidad]
        );

        //especialidad encontrada, no se puede volver a agregar
        if(especialidad.length === 1){
            return res.status(404).render("error", {user: req.user, error: "Esta especialidad fue cargada antes"});
        }

        // cargo la especialidad a la base de datos
        const [result] = await connection.execute(
            "INSERT INTO especialidad (nombre_especialidad) VALUES (?)", 
            [nombre_especialidad]
        );

        if(result.affectedRows == 1){
            return res.redirect("/usuario/gestion?exito=La especialidad fue cargada a la base de datos con exito");
        }else{
            return res.status(500).render("error", {user: req.user, error: `No se puedo agregar especialidad.`});
        }
        
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

async function putSpecialties(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const {id_especialidad, nombre_especialidad} = req.body;
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig); 

        // cargo la especialidad a la base de datos
        const [result] = await connection.execute(
            "UPDATE especialidad SET nombre_especialidad = ? WHERE id_especialidad = ?", 
            [nombre_especialidad, id_especialidad]
        );
        
        if(result.affectedRows == 1){
            return res.redirect("/usuario/gestion?exito=La especialidad fue modificada en la base de datos con exito");
        }else{
            return res.status(500).render("error", {user: req.user, error: `No se puedo agregar especialidad.`});
        }
        
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }

}

async function showPutSpecialties(req, res){
    // Verificación de seguridad: Si no es administrador, no debería tener acceso
    if(!req.user){
        return res.status(403).render("error", {user: req.user, error: "Debes iniciar sesion para poder acceder aqui"});
    }
    if(req.user.administrador == 0){
        return res.status(403).render("error", {user: req.user, error: "No tienes permiso para realizar esta acción"});
    }

    const {id_especialidad} = req.body;
    
    let connection;
    try{
        connection = await mysql.createConnection(cnxConfig); 
        
        // Busco si la especialidad
        const [especialidad] = await connection.execute(`
            SELECT id_especialidad, nombre_especialidad 
            FROM especialidad
            WHERE id_especialidad = ?`,
            [id_especialidad]
        );

        //especialidad no encontrada, no se puede modificar
        if(especialidad.length === 0){
            return res.status(404).render("error", {user: req.user, error: "Esta especialidad no existe"});
        }else{
            return res.render("usuario/editarEspecialidad", {user: req.user, especialidad: especialidad[0]});
        }
        
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});;
    }finally{
        if(connection){
            await connection.end();
        }
    }
}

//para sesiones

async function loginUser(req, res){ // VER 5.0 
    const {correo, contrasena, url} = req.body;

    //#region emailRegex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    // /^[a-zA-Z0-9._-]+ Multiples caracteres que pueden ser letras minus, mayus, numeros, punto, guion bajo o punto
    // @ un simbolo arroba
    // [a-zA-Z0-9._-]+ Multiples caracteres que pueden ser letras minus, mayus, numeros, punto, guion bajo o punto
    // \. obligatoriamente un punto
    // [a-zA-Z]{2,4} obligatoriamente dos y maximo hasta cuatro letras minus o mayus.
    //#endregion
    //#region passwordRegex
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$\.%^&*-]).{8,}$/;
    // (?=.*?[A-Z]) Positive lookahead: De todo lo que viene despues debe existir como minimo una letra mayuscula.
    // (?=.*?[a-z]) Positive lookahead: De todo lo que viene despues debe existir como minimo una letra minuscula.
    // (?=.*?[0-9]) Positive lookahead: De todo lo que viene despues debe existir como minimo un numero.
    // (?=.*?[#?!@$ %^&*-]) Positive lookahead: De todo lo que viene despues debe existir un caracter especial (numeros y letras no cuentan).
    // .{8,} Como minimo ocho caracteres.
    //#endregion

    if (!emailRegex.test(correo)) {
        return res.status(403).render("error", {user: req.user, error: `Por favor, ingresa una dirección de correo electrónico válida.`});
    }else
    if (!passwordRegex.test(contrasena)) {
        return res.status(403).render("error", {user: req.user, error: `Error: La contraseña debe tener al menos 8 caracteres, contener minimo una mayúscula, una minúscula, un número y un caracter especial.`});
    }


    let connection;
    try { 
        connection = await mysql.createConnection(cnxConfig); 
        
        const [usuarios] = await connection.execute("SELECT * FROM usuario WHERE correo = ?", [correo]); 
        if (usuarios.length === 0){
            console.log("usuario no encontrado en base de datos al intentar logear");
            return res.status(403).render("error", {user: req.user, error: "Datos incorrectos."});
        } 
        
        const usuario = usuarios[0]; 
        if (!(await bcrypt.compare(contrasena, usuario.contrasena))){
            console.log("contrasena proporcinada incorrecta al intentar loguear")
            return res.status(403).render("error", {user: req.user, error: "Datos incorrectos."});
        }
        
        // Crear el token JWT 
        const encoder = new TextEncoder(); 
        const secret = encoder.encode(process.env.JWT_PRIVATE_KEY); 
        const jwtConstructor = new jose.SignJWT({id_usuario: usuario.id_usuario, contrasena: usuario.contrasena});
        const jwt = await jwtConstructor.setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime(process.env.JWT_EXPIRATION)
            .sign(secret);
        
        // Preparar y crear la cookie 
        const options = {
            expires: new Date(Date.now() + process.env.JWT_EXPIRATION_COOKIE * 24 * 60 * 60 * 1000),
            httpOnly: true
        }; 
        
        res.cookie('jwt', jwt, options); 
        return res.status(200).redirect(url);
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{ 
        if (connection){
            await connection.end();
        }
    }
}

function logoutUser(req, res){ //Necesito chequear un tutorial para evitar que se almacene la cache al volver atras
    res.clearCookie('jwt');
    return res.status(200).render("exito", {mensajeExito: "Sesion cerrada exitosamente."});
}


module.exports = {
    getGestion,
    getAllUsers,
    showAddUser,
    addUser,
    showUpdateUser,
    updateUser,
    getAllAdmin,
    showAddAdmin,
    addAdmin,
    deactivateAdmin,
    getAllMedic,
    showAddMedic,
    addMedic,
    deactivateMedic,
    loginUser,
    logoutUser,
    showSpecialties,
    showAddSpecialties,
    addSpecialties,
    showPutSpecialties,
    putSpecialties,
    getAllSpecialties,
    showAddSpecialtyToMedic,
    addSpecialtyToMedic,
    alternateLicense,
    showPutLicense,
    putLicense
};