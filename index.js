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
/**************************************************************/


/************************* Routes *****************************/
//#region usuario
const usuarioRoute = require('./routes/usuario.route');
app.use('/usuario', usuarioRoute);
//#endregion
/**************************************************************/


//error 404
app.get("*", function (req, res){
    res.send("<h1>404</h1>");
});

//levanto el servidor
app.listen(8000, function (req, res){ console.log("svr open"); });

//NECESITO VER PROMESAS DE CONSULTAS
//TAMBIEN VER CONSULTAS PREPARADAS