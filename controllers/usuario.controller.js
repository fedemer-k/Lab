//#region Mysql2
const mysql = require("mysql2");
const cnx = mysql.createConnection({ host: "localhost", database: "SistemaUsuario", user: "root", password:"1231233" });
//#endregion
//#region UUID
// generador de id unicas
const uuid = require("uuid");
//#endregion

function getAllUsers(req, res){
    const borrado = {};
    req.query.borrado ? req.query.borrado : "";

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
}

function addUser(req, res){
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
}

function deleteUser(req, res){
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
}

function updateUser(req, res){
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
}

function showUpdateUser(req, res){
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
}

function showAddUser(req, res){
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
}

module.exports = {
    getAllUsers,
    addUser,
    deleteUser,
    updateUser,
    showUpdateUser,
    showAddUser
};