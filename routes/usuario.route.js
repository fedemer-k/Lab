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
    # /gestion                        POST    (Muestra una botonera para acceder a toda la gestion de todo)
    A /usuario                        POST    (Muestra usuarios, admins o medicos segun el post)
    M /usuario                        PUT     (actualiza usuario)
    # /usuario                        GET     (renderiza los tres botones de tipo de usuario)
    # /usuario/alta                   GET     (renderiza formulario de alta)
    # /usuario/alta                   POST    (Alta de usuario)
    # /usuario/alta/administrador     GET     (renderiza formulario de alta)
    # /usuario/alta/administrador/id  POST    (Alta de administrador)
    # /usuario/alta/administrador/id  DELETE  (Desactivacion de administrador)
    # /usuario/alta/medico            GET     (renderiza formulario de alta)
    # /usuario/alta/medico/id         POST    (Alta de medico)
    # /usuario/alta/medico/id         DELETE  (Desactivacion de medico)
    # /usuario/editar/id              GET     (renderiza formulario de modificacion)
    # /usuario/login                  POST    (Crea un jwt y lo guarda en cookie)
    # /usuario/logout                 GET     (Destruye la cookie)

    know bugs:
        # no se borran las imagenes cuando se borra un usuario
        # no permite cambiar la imagen de un usuario.
##############################################################*/

//Librerias a utilizar:
//#region Express
//express framework backend
const express = require("express");
//#endregion

const usuarioController = require("../controllers/usuario.controller.js");
const router = express.Router();

//por defecto muestro botonera con todos los tipos de usuarios para listar
router.route("/gestion").get(usuarioController.getGestion);

//Listo todos los usuarios
router.route("/").get(usuarioController.getAllUsers);

//recibo un usuario por put (a traves de una chapuza) 
//y lo actualizo en la db FUNCIONA!
router.route("/").put(usuarioController.updateUser);

//Busco al usuario, y muestro el formulario con los datos 
//anteriores por defecto (necesito su id por parametro) FUNCIONA!
router.route("/editar/:id_usuario").get(usuarioController.showUpdateUser);

//muestro formulario de alta, dicho formulario
//apunta a /usuario via post FUNCIONA!
router.route("/alta").get(usuarioController.showAddUser);

//recibo el usuario a agreagar por post, y lo agrego a la db FUNCIONA!
//luego redirecciono a usuario (GET), enviando el mensaje de agregado (GET)
router.route("/alta").post(usuarioController.addUser);

//listo a todos los administradores
//apunta a /usuario/administrador via get TESTMODE!
router.route("/administrador").get(usuarioController.getAllAdmin);

//muestro formulario de alta, dicho formulario
//apunta a /usuario/alta/administrador via post TESTMODE!
router.route("/administrador/alta").get(usuarioController.showAddAdmin);

//recibo el usuario a asignar como administrador por post, y lo agrego a la db TESTMODE!
//luego redirecciono a usuario/alta/administrador (GET), enviando el mensaje de agregado (GET)
router.route("/administrador/alta/:id_usuario").post(usuarioController.addAdmin);

//recibo el usuario a desactivar como administrador por delete, y lo agrego a la db TESTMODE!
//luego redirecciono a usuario/alta/administrador (GET), enviando el mensaje de desactivado (GET)
router.route("/administrador/baja/:id_usuario").delete(usuarioController.deactivateAdmin);

//listo a todos los medicos
//apunta a /usuario/medico via get TESTMODE!
router.route("/medico").get(usuarioController.getAllMedic);

//muestro formulario de alta, dicho formulario
//apunta a /usuario/alta/medico via post TESTMODE!
router.route("/medico/alta").get(usuarioController.showAddMedic);

//recibo el usuario a asignar como medico por post, y lo agrego a la db TESTMODE!
//luego redirecciono a usuario/alta/administrador (GET), enviando el mensaje de agregado (GET)
router.route("/medico/alta/:id_usuario").post(usuarioController.addMedic);

//recibo el usuario a desactivar como medico por post, y lo agrego a la db TESTMODE!
//luego redirecciono a usuario/alta/medico (GET), enviando el mensaje de desactivado (GET)
router.route("/medico/baja/:id_usuario").delete(usuarioController.deactivateMedic);

//muestro las especialidades que hay
router.route("/especialidad").get(usuarioController.showEspecialties);

//muestro formulario para crear especialidad
router.route("/especialidad/alta").get(usuarioController.showAddEspecialties);

//muestro formulario para modificar especialidad
router.route("/especialidad/alta").post(usuarioController.showPutEspecialties);

//recibo una especialidad por post y la agrego
router.route("/especialidad").post(usuarioController.addEspecialties);

//recibo una especialidad por put, y la modifico
router.route("/especialidad").put(usuarioController.putEspecialties);

//Realizo las comprobaciones y logueo al usuario
//apunta a /usuario/login
router.route("/login").post(usuarioController.loginUser);

//Elimino la cookie que guarda la session jwt.
//apunta a /usuario/logout
router.route("/logout").get(usuarioController.logoutUser);


module.exports = router;