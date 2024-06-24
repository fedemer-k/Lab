const router = require("express").Router();
//#region Mysql2
const mysql = require("mysql2");
const cnx = mysql.createConnection({ host: "localhost", database: "practica", user: "root", password:"1231233" });
//#endregion

/*##############################################################
##########  Comienzan los "matches" de las url #################
################################################################
*/

//por defecto muestro los usuarios
//antes era "/medicos"
router.get("/", function (req, res){
    const borrado = req.query.borrado ? req.query.borrado : "";

    cnx.connect(function (){
        cnx.query(
            "select m.id, m.nombre, m.edad, m.urlImagen, e.descripcion from medicos m join especialidades e on m.especialidad = e.id", 
            function(error, result){
                if(error){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    res.render("medicos/listar", { medicos: result, borrado:borrado });
                    console.log(result);
                }
            }
        );
    });
});

//recibo el usuario a agreagar por post, y lo agrego a la db
//luego redirecciono a medicos (GET), enviando el mensaje de agregado (GET)
//ruta anterior "/medicos"
app.post("/", function (req, res){
    const {nombre, edad, especialidad} = req.body;
    const {archivo} = req.files;
    const nombreFinal = uuid.v1() + archivo.name;
    archivo.mv("../imagenes/" + nombreFinal );

    cnx.connect(function (){
        cnx.query(
            "insert into medicos (nombre, especialidad, edad, urlImagen, type, size) values (?,?,?,?,?,?)",
            [nombre, especialidad, edad, nombreFinal, archivo.mimetype, archivo.size],
            function (error, resultado){
                if(error){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    if (resultado.affectedRows == 1){
                        res.redirect(`/medicos?borrado=El medico ${nombre} fue agregado con exito.`);
                    }else{
                        res.send(`<h1>ERROR EN LA BASE DE DATOS</h1> El medico ${nombre} NO fue agregado.`);
                    }
                }
            }
        );
    });
});

//recibo el usuario a eliminar por delete, (a traves de una chapuza) y lo elimino de la db
//ruta anterior "/medicos/:id"
app.delete("/:id", function (req, res){
    cnx.connect(function (){
        cnx.query(
            `delete from medicos where id = ${req.params.id}`, 
            function (error, resultado){
                if(error){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    if(resultado.affectedRows == 1){
                        res.redirect("/medicos?borrado=Se borro el medico " + req.params.id)
                     }else{
                        res.send("<h1>error</h1>");
                    }
                }
            }
        );
    });
});

//recibo un usuario por put (a traves de una chapuza) y lo actualizo en la db
//ruta anterior "/medicos"
app.put("/", function (req, res){
    const { nombre, edad, especialidad, id } = req.body;

    cnx.connect(function(){
        cnx.query(
            `update medicos set nombre = '${nombre}', edad = ${edad}, especialidad = ${especialidad} where id = ${id}`,
            function(error, resultado){
                if(error){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    if (resultado.affectedRows == 1){
                        res.redirect(`/user?borrado=El usuario ${nombre} fue ACTUALIZADO con exito.`);
                    }else{
                        res.send(`<h1>ERROR EN LA BASE DE DATOS</h1> El usuario ${nombre} NO fue agregado.`);
                    }
                }
            }
        )
    })
});

//Busco al usuario, y muestro el formulario con los datos anteriores por defecto (necesito su id por parametro)
//ruta anterior "/medico/editar/:id"
app.get("/user/editar/:id", function (req, res){
    let usuario = {};
    let especialidades = {};

    cnx.connect(function (){
        cnx.query("select * from medicos where id =" + req.params.id, function (error, resultado){
            if(error){
                res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
            }else{
                usuario = {...resultado[0]};
                cnx.query("select * from especialidades", function (error, resultado){
                    if(error){
                        res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                    }else{
                        especialidades = {...resultado};
                        res.render("user/editar", {usuario: usuario, especialidades: especialidades});
                    }
                });
            }
        });
    });
});

//muestro formulario de alta, dicho formulario, apunta a /medicos via post
//ruta anterior "/medico/alta"
app.get("/alta", function (req, res){
    cnx.connect(function(){
        cnx.query(
            "select * from especialidades", 
            function (error, resultado){
                if(error){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    res.render("usuario/alta", {especialidades: resultado});
                 }
            }
        );
    });
});


module.exports = router;