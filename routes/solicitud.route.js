/*##############################################################
Route de solicitud:
    Funcionalidad: Utilizado para mostrar las solicitudes.

  - Mostrar todas las fechas disponibles para emitir un turno
  - Al seleccionar una fecha, permitir seleccionar un horario
  - Al confirmar se deberia ir al loguear o rellenar sus datos.
  - Mensaje final de informando que su solicitud se proceso correctamente
    
Rutas:
    A /usuario           POST     (alta de usuario)

    know bugs:
        # none
##############################################################*/

//Librerias a utilizar:
//#region Express
//express framework backend
const express = require("express");
//#endregion

const solicitudController = require("../controllers/solicitud.controller.js");
const router = express.Router();

//por defecto muestro todos los turnos que puedo sacar
router.route("/").post(solicitudController.getEmitirSolicitud);

//Recibo la especialidad, medico y fecha por url y solicitio confirmacion de solicitud de turno
router.route("/emitir/:bloque").get(solicitudController.showAddRequest);

//Recibo todos los datos de solicitud de turno, corroboro que se pueda, lo agrego y respondo
router.route("/emitir/:bloque").post(solicitudController.addRequest);

//Muestro todos los turnos que trabaja y que no trabaja el medico recibido por id
router.route("/rango/:id_medico").get(solicitudController.getShowRange);

//agrego un bloque de horario a los bloques de horarios que posee el medico.
router.route("/rango/agregar/:bloque").get(solicitudController.addBlock);

//elimino un bloque de horario de los bloques de horarios que posee el medico.
router.route("/rango/eliminar/:bloque").get(solicitudController.subtractBlock);


module.exports = router;