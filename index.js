//NOTA para redimencionar las imagenes, 
//se puede utilizar la api sharp nodejs

/*************************************************  Librerias */
//#region Express
//obligatorio para iniciar express
const express = require("express");
//#endregion
//#region MethodOverride
//para sobreescribir metodos que me envian por post              
const methodOverride = require("method-override");
//#endregion
//#region Mysql2
// para poder usar mysql2
const mysql = require("mysql2");
const cnx = mysql.createConnection({ host: "localhost", database: "practica", user: "root", password:"1231233" });
//#endregion
//#region Express-FileUpload
// se usa para poder subir archivos
const upload = require("express-fileupload");
//#endregion
//#region UUID
// generador de id unicas
const uuid = require("uuid");
//#endregion
/**************************************************************/


//ejecuto express para que me devuelva el objeto app
app = express();


/**********************  Establezco configuraciones a express */
//#region Configuracion de vistas
//indico donde van a estar mis vistas
app.set("views", "views");
//indico el motor de vistas
app.set("view engine", "pug");
//#endregion
/**************************************************************/


/***************************************************************
*********  Ejecuto todos los middlewares que ponen *************
*********  las librerias requeridas en funcionamiento. *********
****************************************************************
*/
//urlencoded, toma todo lo que me envian por get, y lo mete a res.body
app.use(express.urlencoded());
//debo hacer un USE para que pueda sobreescribir el metodo
app.use(methodOverride("_method"));
//este middleware, agrega el objeto files al req, y solo acpeta archivos menores a 50mb
app.use(upload({limits: {fileSize: 50 * 1024 * 1024}}));
//para poder acceder a las imagenes
app.use(express.static("./imagenes"));
/**************************************************************/



/*##############################################################
##########  Comienzan los "matches" de las url #################
################################################################
*/
//por defecto muestro los medicos
app.get("/medicos", function (req, res){
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

//recibo el medico a agreagar por post, y lo agrego a la db
//luego redirecciono a medicos (GET), enviando el mensaje de agregado (GET)
app.post("/medicos", function (req, res){
    const {nombre, edad, especialidad} = req.body;
    const {archivo} = req.files;
    const nombreFinal = uuid.v1() + archivo.name;
    archivo.mv("./imagenes/" + nombreFinal );

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

//recibo el medico a eliminar por delete, (a traves de una chapuza) y lo elimino de la db
app.delete("/medicos/:id", function (req, res){
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

//recibo un medico por put (a traves de una chapuza) y lo actualizo en la db
app.put("/medicos", function (req, res){
    const { nombre, edad, especialidad, id } = req.body;

    cnx.connect(function(){
        cnx.query(
            `update medicos set nombre = '${nombre}', edad = ${edad}, especialidad = ${especialidad} where id = ${id}`,
            function(error, resultado){
                if(error){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    if (resultado.affectedRows == 1){
                        res.redirect(`/medicos?borrado=El medico ${nombre} fue ACTUALIZADO con exito.`);
                    }else{
                        res.send(`<h1>ERROR EN LA BASE DE DATOS</h1> El medico ${nombre} NO fue agregado.`);
                    }
                }
            }
        )
    })
});

//Busco al medico, y muestro el formulario con los datos anteriores por defecto (necesito su id por parametro)
app.get("/medico/editar/:id", function (req, res){
    let medico = {};
    let especialidades = {};

    cnx.connect(function (){
        cnx.query("select * from medicos where id =" + req.params.id, function (error, resultado){
            if(error){
                res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
            }else{
                medico = {...resultado[0]};
                cnx.query("select * from especialidades", function (error, resultado){
                    if(error){
                        res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                    }else{
                        especialidades = {...resultado};
                        res.render("medicos/editar", {medico: medico, especialidades: especialidades});
                    }
                });
            }
        });
        
    });
});

//muestro formulario de alta, dicho formulario, apunta a /medicos via post
app.get("/medico/alta", function (req, res){
    cnx.connect(function(){
        cnx.query(
            "select * from especialidades", 
            function (error, resultado){
                if(error){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1>");
                }else{
                    res.render("medicos/alta", {especialidades: resultado});
                 }
            }
        );
    });
});

//error 404
app.get("*", function (req, res){
    res.send("<h1>404</h1>");
});

//levanto el servidor
app.listen(8000, function (req, res){
    console.log("server iniciado correctamente");
});

//NECESITO VER PROMESAS DE CONSULTAS
//TAMBIEN VER CONSULTAS PREPARADAS