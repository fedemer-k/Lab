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
router.get("/", function (req, res){
    const borrado = req.query.borrado ? req.query.borrado : "";

    cnx.connect(function (){
        cnx.query(
            "select u.id, u.nombre, u.edad, u.urlimagen, r.rol from usuario u join rol r on u.rol = r.id", 
            function(err, result){
                if(err){
                    res.send(err);
                }else{
                    res.render("usuario/listar", { usuarios: result, borrado:borrado });
                    console.log(result);
                }
            }
        );
    });
});

//recibo el usuario a agreagar por post, y lo agrego a la db FUNCIONA!
//luego redirecciono a medicos (GET), enviando el mensaje de agregado (GET)
router.post("/", function (req, res){
    const {nombre, edad, rol} = req.body;
    const {imagen} = req.files;
    const nombreFinal = uuid.v1() + imagen.name;
    imagen.mv("./imagenes/" + nombreFinal );

    cnx.connect(function (){
        cnx.query(
            "insert into usuario (nombre, rol, edad, urlImagen, type, size) values (?,?,?,?,?,?)",
            [nombre, rol, edad, nombreFinal, imagen.mimetype, imagen.size],
            function (err, result){
                if(err){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    if (result.affectedRows == 1){
                        res.redirect(`/usuario?borrado=El usuario ${nombre} fue agregado con exito.`);
                    }else{
                        res.send(`<h1>ERROR EN LA BASE DE DATOS</h1> El usuario ${nombre} NO fue agregado.`);
                    }
                }
            }
        );
    });
});

//recibo el usuario a eliminar por delete, (a traves de una chapuza) 
//y lo elimino de la db NO ELIMINA LA IMAGEN pero FUNCIONA!
router.delete("/:id", function (req, res){
    cnx.connect(function (){
        cnx.query(
            `delete from usuario where id = ${req.params.id}`, 
            function (err, result){
                if(err){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    if(result.affectedRows == 1){
                        res.redirect("/usuario?borrado=Se borro el usuario " + req.params.id)
                     }else{
                        res.send("<h1>error</h1>");
                    }
                }
            }
        );
    });
});

//recibo un usuario por put (a traves de una chapuza) 
//y lo actualizo en la db FUNCIONA!
router.put("/", function (req, res){
    const { nombre, edad, rol, id } = req.body;

    cnx.connect(function(){
        cnx.query(
            `update usuario set nombre = '${nombre}', edad = ${edad}, rol = ${rol} where id = ${id}`,
            function(err, result){
                if(err){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    if (result.affectedRows == 1){
                        res.redirect(`/usuario?borrado=El usuario ${nombre} fue ACTUALIZADO con exito.`);
                    }else{
                        res.send(`<h1>ERROR EN LA BASE DE DATOS</h1> El usuario ${nombre} NO fue agregado.`);
                    }
                }
            }
        )
    })
});

//Busco al usuario, y muestro el formulario con los datos 
//anteriores por defecto (necesito su id por parametro) FUNCIONA!
router.get("/editar/:id", function (req, res){
    let usuario = {};
    let roles = {};

    cnx.connect(function (){
        cnx.query("select * from usuario where id =" + req.params.id, function (err, result){
            if(err){
                res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
            }else{
                usuario = {...result[0]};
                cnx.query("select * from rol", function (err, result){
                    if(err){
                        res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                    }else{
                        roles = {...result};
                        res.render("usuario/editar", {usuario: usuario, roles: roles});
                    }
                });
            }
        });
    });
});

//muestro formulario de alta, dicho formulario
//apunta a /medicos via post FUNCIONA!
router.get("/alta", function (req, res){
    cnx.connect(function(){
        cnx.query(
            "select * from rol", 
            function (err, result){
                if(err){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    res.render("usuario/alta", {roles: result});
                 }
            }
        );
    });
});


module.exports = router;