//NOTA para redimencionar las imagenes, 
//se puede utilizar la api sharp nodejs

/*################################################  Librerias */
//#region dotenv
//toma el archivo .env y carga todas las variables a process.env
//Esta libreria es la unica que ejecuta codigo en este bloque de librerias
const dotenv = require('dotenv').config();
//#endregion
//#region Express
//express framework backend
const express = require("express");
//#endregion
//#region MethodOverride
//para sobreescribir metodos que me envian por post              
const methodOverride = require("method-override");
//#endregion
//#region Express-FileUpload
// se usa para poder subir archivos
const upload = require("express-fileupload");
//#endregion
//#region cookie-parser
//Parsea cookies, las firma y las deja en formato json
const cookieParser = require('cookie-parser');
//#endregion
//#region isAuthenticatedUser
//Revisa si hay una cookie y comprueba su jwt. Si todo es correcto guarda todo en req.user 
const isAuthenticatedUser = require('./middleware/authMiddleware');
//#endregion
//#region Mysql2
const mysql = require("mysql2/promise");
const cnxConfig = { 
	host:     process.env.DB_HOST, 
	database: process.env.DB_DATABASE, 
	user:     process.env.DB_USER, 
	password: process.env.DB_PASS
};
//#endregion
//#region onlyForDevelopment
//Livereload and connect-livereload auto refresh after changes
let livereload
let connectLivereload
let liveReloadServer
if(process.env.DEVELOPER_MODE == 1){
    livereload = require("livereload");
    connectLivereload = require("connect-livereload");
    liveReloadServer = livereload.createServer();
    liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
            liveReloadServer.refresh("/");
        }, 100);
    });
    console.log("DEVELOPER MODE ON");
}else{
    console.log("DEVELOPER MODE OFF");
}
console.log(process.env.DEVELOPER_MODE)
//#endregion
/*############################################################*/


//ejecuto express para que me devuelva el objeto app
app = express();

/**********************  Establezco configuraciones a express */
//#region Configuracion de vistas
//indico donde van a estar mis vistas
app.set("views", "views");
//indico el motor de vistas
app.set("view engine", "pug");
//#endregion
//#region Agrego rutas estaticas
//para poder acceder a las imagenes
app.use(express.static("./imagenes"));
//#endregion
/**************************************************************/


/***************************************************************
*********  Ejecuto todos los middlewares que ponen *************
*********  las librerias requeridas en funcionamiento. *********
***************************************************************/
//#region methodOverride
//debo hacer un USE para que pueda sobreescribir el metodo
app.use(methodOverride("_method"));
//#endregion
//#region URLencoded
//toma todo lo que me envian por get, y lo mete a res.body
app.use(express.urlencoded());
//#endregion
//#region Express-FileUpload
//este middleware, agrega el objeto files al req, y solo acpeta archivos menores a 50mb
app.use(upload({limits: {fileSize: 50 * 1024 * 1024}}));
//#endregion
//#region cookie-parser
//se ejecuta el middleware de cookie-parser
app.use(cookieParser());
//#endregion
//#region onlyForDevelopment
//connect middleware for adding the Livereload script to the response
if(process.env.DEVELOPER_MODE == 1){
    app.use(connectLivereload());
    console.log("DEVELOPER MODE ON");
}else{
    console.log("DEVELOPER MODE OFF");
}
//#endregion
//#region isAuthenticatedUser
// Aplicar el middleware de autenticación globalmente 
app.use(isAuthenticatedUser);
//#endregion
/**************************************************************/


/************************* Routes *****************************/
//#region usuario
const usuarioRoute = require('./routes/usuario.route');
app.use('/usuario', usuarioRoute);
//#endregion
//#region solicitud
const solicitudRoute = require('./routes/solicitud.route');
app.use('/solicitud', solicitudRoute);
//#endregion
/**************************************************************/

//probar que pasa cuando no tengo medicos ni especialidades activas.
app.get("/", async function (req, res){

	const exito = req.query.exito ? req.query.exito : "";
	const error = req.query.error ? req.query.error : "";

	let connection;
    try{
        connection = await mysql.createConnection(cnxConfig);
        
        //#region Obtengo todas las Especialidades que tienen medicos y matriculas activas.
        const [especialidades] = await connection.execute(`
            SELECT DISTINCT
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
            JOIN
                usuario u 
                ON me.id_usuario = u.id_usuario
            WHERE
                me.activo = 1 AND ma.activo = 1;
        ;`);
        //#endregion
        
        let especialidadesYMedicos = [];
        //Recorro cada especialidad para obtener todos los medicos separados por dicha especialidad
        for (const especialidad of especialidades) {
            const [medicos] = await connection.execute(`
                SELECT
                    u.nombres,
                    u.apellidos,
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
                JOIN
                    usuario u 
                    ON me.id_usuario = u.id_usuario
                WHERE
                    me.activo = 1 AND ma.activo = 1 AND e.id_especialidad = ?;
                ;`,[especialidad.id_especialidad]
            );

            especialidadesYMedicos.push({ 
                especialidad, 
                medicos
            });

        }

        return res.status(200).render("index", {user: req.user, especialidadesYMedicos, exito: exito, error: error});
    }catch(err){
        return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
    }finally{
        if(connection){
            await connection.end();
        }
    }
	return res.status(500).render("index", {user: req.user, error: `ERROR 404`});
});


//error 404
app.get("*", function (req, res){
	return res.status(500).render("error", {user: req.user, error: `ERROR 404`});
});

//levanto el servidor
app.listen(process.env.PORT, function (req, res){ console.log("svr open"); });