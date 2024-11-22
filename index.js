//NOTA para redimencionar las imagenes, 
//se puede utilizar la api sharp nodejs

/*################################################  Librerias */
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
//#region dotenv
//toma el archivo .env y carga todas las variables a process.env
const dotenv = require('dotenv');
//#endregion
//#region isAuthenticatedUser
//Revisa si hay una cookie y comprueba su jwt. Si todo es correcto guarda todo en req.user 
const isAuthenticatedUser = require('./middleware/authMiddleware');
//#endregion
//#region Mysql2
const mysql = require("mysql2/promise");
const cnxConfig = { 
  host:     'bahncy9cfv5sc1wycsii-mysql.services.clever-cloud.com', 
  database: 'bahncy9cfv5sc1wycsii', 
  user:     'uppjvqpmklnvhjzu', 
  password: 'xbKyu18VPzmF2fEnVFuc'
};
//#endregion
//#region onlyForDevelopment
//Livereload and connect-livereload auto refresh after changes
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});
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
//#region dotenv
//carga todas las variables del .env al process.env
dotenv.config();
//#endregion
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
app.use(connectLivereload());
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


//
app.get("/", function (req, res){
  return res.status(500).render("error", {user: req.user, error: `ERROR 404`});
});


//error 404
app.get("*", function (req, res){
  return res.status(500).render("error", {user: req.user, error: `ERROR 404`});
});

//levanto el servidor
app.listen(process.env.PORT, function (req, res){ console.log("svr open"); });