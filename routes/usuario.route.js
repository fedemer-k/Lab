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
    # /gestion                                               POST    (Muestra una botonera para acceder a toda la gestion de todo)
    A /                                                      POST    (Muestra usuarios, admins o medicos segun el post)
    M /                                                      PUT     (actualiza usuario)
    # /                                                      GET     (renderiza los tres botones de tipo de usuario)
    # /alta                                                  GET     (renderiza formulario de alta)
    # /alta                                                  POST    (Alta de usuario)
    # /editar/:id_usuario                                    GET     (renderiza formulario de modificacion)
    # /login                                                 POST    (Crea un jwt y lo guarda en cookie)
    # /logout                                                GET     (Destruye la cookie)

    # /alta/administrador                                    GET     (renderiza formulario de alta)
    # /alta/administrador/:id_usuario                        POST    (Alta de administrador)
    # /alta/administrador/:id_usuario                        DELETE  (Desactivacion de administrador)

    # /alta/medico                                           GET     (renderiza formulario de alta)
    # /alta/medico/:id_usuario                               POST    (Alta de medico)
    # /alta/medico/:id_usuario                               DELETE  (Desactivacion de medico)

    # /especialidad                                          GET     (Lista las especialidades existentes en db)
    # /especialidad                                          POST    (Recibe y procesesa datos para crear especialidad)
    # /especialidad/alta                                     GET     (Renderiza formulario para crear especialidad)
    # /especialidad/alta                                     POST    (Renderiza formulario para modificar especialidad recibida)
    # /especialidad                                          PUT     (Recibe y procesesa datos para modificar la especialidad)

    # /medico/matricula/:id_medico                           GET     (Muestra todas las especialidades/matriculas de dicho medico)
    # /medico/matricula/alta/:id_medico                      GET     (Formulario para asignar una especialidad y matricula al medico)
    # /medico/matricula/alta/:id_medico                      POST    (Recibe y procesesa datos para asignar una especialidad y matricula al medico)
    # /medico/matricula/editar/:id_medico/:id_matricula      GET     (Formulario para modificar una matricula al medico)
    # /medico/matricula/editar/:id_medico/:id_matricula      POST    (Recibe y procesesa datos para modificar y matricula al medico)
    # /medico/matricula/editar/:id_medico/:id_matricula      DELETE  (Desactivacion/Activacion de matricula para dicho medico)

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

//Lista las especialidades existentes en db
router.route("/especialidad").get(usuarioController.showSpecialties);

//Renderiza formulario para crear especialidad
router.route("/especialidad/alta").get(usuarioController.showAddSpecialties);

//Renderiza formulario para modificar especialidad recibida
router.route("/especialidad/alta").post(usuarioController.showPutSpecialties);

//recibo una especialidad por post y la agrego
router.route("/especialidad").post(usuarioController.addSpecialties);

//recibo una especialidad por put, y la modifico
router.route("/especialidad").put(usuarioController.putSpecialties);

//Realizo las comprobaciones y logueo al usuario
//apunta a /usuario/login
router.route("/login").post(usuarioController.loginUser);

//Elimino la cookie que guarda la session jwt.
//apunta a /usuario/logout
router.route("/logout").get(usuarioController.logoutUser);

//Muestra todas las especialidades/matriculas de dicho medico
//apunta a medico/matricula/:id_medico
router.route("/medico/matricula/:id_medico").get(usuarioController.getAllSpecialties);

//Formulario para asignar una especialidad y matricula al medico
//apunta a medico/matricula/alta/:id_medico
router.route("/medico/matricula/alta/:id_medico").get(usuarioController.showAddSpecialtyToMedic);

//Recibe y procesesa datos para asignar una especialidad y matricula al medico
//apunta a usuario/medico/matricula/alta/:id_medico
router.route("/medico/matricula/alta/:id_medico").post(usuarioController.addSpecialtyToMedic);

//Formulario para modificar una matricula al medico
//apunta a /medico/matricula/editar/:id_medico/:id_matricula
router.route("/medico/matricula/editar/:id_medico/:id_matricula").get(usuarioController.showPutLicense);

//Desactivacion/Activacion de matricula para dicho medico
//apunta a /medico/matricula/editar/:id_medico/:id_matricula
router.route("/medico/matricula/editar/:id_medico/:id_matricula").post(usuarioController.putLicense);

//Desactivacion/Activacion de matricula para dicho medico
//apunta a /medico/matricula/editar/:id_medico/:id_matricula
router.route("/medico/matricula/editar/:id_medico/:id_matricula").delete(usuarioController.alternateLicense);

module.exports = router;