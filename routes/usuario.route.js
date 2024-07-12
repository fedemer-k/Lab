/*##############################################################
Route de usuario:
    Funcionalidad:Es cualquiera, deberia solo tener las rutas
    y tiene eso mezclado con lo que deberia ir en controller.

  - Implementar login
  - Implementar logout.
  - Implementar sistema de permisos donde:
  - admin -> ABM usuarios
  - usuario -> modificar sus datos personales.
  - usuario -> dar de "baja" a si mismo, que en realidad desactiva el usuario,
  - admin -> ABM permisos (Naaah seria muy denso)
    
Rutas:
    A /usuario           POST     (alta de usuario)
    B /usuario/id        DELETE   (elimina usuario)
    M /usuario           PUT      (actualiza usuario)
    # /usuario           GET      (renderiza lista usuarios)
    # /usuario/alta      GET     (renderiza formulario de alta)
    # /usuario/editar/id GET    (renderiza formulario de modificacion)

    know bugs:
        # no se borran las imagenes cuando se borra un usuario
        # no permite cambiar la imagen de un usuario.
##############################################################*/

//Librerias a utilizar:
//#region Express
//express framework backend
const express = require("express");
//#endregion
//#region Mysql2
const mysql = require("mysql2");
const cnx = mysql.createConnection({ host: "localhost", database: "SistemaUsuario", user: "root", password:"1231233" });
//#endregion
//#region UUID
// generador de id unicas
const uuid = require("uuid");
//#endregion

const router = express.Router();

//por defecto muestro los usuarios FUNCIONA!


//recibo el usuario a agreagar por post, y lo agrego a la db FUNCIONA!
//luego redirecciono a medicos (GET), enviando el mensaje de agregado (GET)
router.post("/", function (req, res){

//recibo el usuario a eliminar por delete, (a traves de una chapuza) 
//y lo elimino de la db NO ELIMINA LA IMAGEN pero FUNCIONA!
router.delete("/:id", function (req, res){

//recibo un usuario por put (a traves de una chapuza) 
//y lo actualizo en la db FUNCIONA!
router.put("/", function (req, res){

//Busco al usuario, y muestro el formulario con los datos 
//anteriores por defecto (necesito su id por parametro) FUNCIONA!
router.get("/editar/:id", function (req, res){

//muestro formulario de alta, dicho formulario
//apunta a /medicos via post FUNCIONA!
router.get("/alta", function (req, res){


module.exports = router;