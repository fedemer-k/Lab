//#region Mysql2
const mysql = require("mysql2");
const cnx = mysql.createConnection({ host: "localhost", database: "SistemaUsuario", user: "root", password:"1231233" });
//#endregion
//#region UUID
// generador de id unicas
const uuid = require("uuid");
//#endregion
//#region bcrypt
//generador de hash con salt incluida
const bcrypt = require("bcrypt");
//#endregion
//#region JsonWebToken (jose)
//Sirve para crear un token y enviarlo al usuario para que el lo retorne adjuntado a su proxima peticion.
const jose = require('jose');
//#endregion

async function getAllUsers(req, res){
    let autenticado = false;
    //Compruebo que el usuario este autenticado
        //Obteniendo la cabezera autorization HTTP para obtener los tokens de autenticacion
    const {autorization} = req.headers;

        //Comprobando si el usuario esta autenticado
    if(!autorization){
        autenticado = false;    //nisiquiera trae cabecera.
        console.log("usuario no autenticado");
    }else{
        //transformando la contraseña a Uint8Array
        const encoder = new TextEncoder();
        const secret = encoder.encode('JWT_PRIVATE_KEY')

        try{
            const jwtData = await jose.jwtVerify(autorization, secret);
            console.log("Contenido de JWTDATA:" + jwtData + "FIN DE JWTDATA");
        }catch(err){
            console.log("EXPLOTO EL JWTVERIFY")
        }
    }

    const borrado = req.query.borrado ? req.query.borrado : "";

    cnx.connect(function (){
        cnx.query(
            "select u.id, u.nombre, u.edad, u.urlimagen, r.rol from usuario u join rol r on u.rol = r.id", 
            function(err, result){
                if(err){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1><br>" + err);
                }else{
                    res.render("usuario/listar", { usuarios: result, borrado:borrado });
                    console.log(result);
                }
            }
        );
    });
}

async function addUser(req, res){
    const {nombre, correo, password, edad, rol} = req.body;
    const {imagen} = req.files; //Err de imagen nula??
    const nombreFinal = uuid.v1() + imagen.name;

    /*
        1.  Validar correo
        2.  Validar contrasena
        3.  Revisar si el correo ya existe en db
        4.  Crear SALT
        5.  Hashear contrasena
    */
    //#region emailRegex
    emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    // /^[a-zA-Z0-9._-]+ Multiples caracteres que pueden ser letras minus, mayus, numeros, punto, guion bajo o punto
    // @ un simbolo arroba
    // [a-zA-Z0-9._-]+ Multiples caracteres que pueden ser letras minus, mayus, numeros, punto, guion bajo o punto
    // \. obligatoriamente un punto
    // [a-zA-Z]{2,4} obligatoriamente dos y maximo hasta cuatro letras minus o mayus.
    //#endregion
    //#region passwordRegex
    passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    // (?=.*?[A-Z]) Positive lookahead: De todo lo que viene despues debe existir como minimo una letra mayuscula.
    // (?=.*?[a-z]) Positive lookahead: De todo lo que viene despues debe existir como minimo una letra minuscula.
    // (?=.*?[0-9]) Positive lookahead: De todo lo que viene despues debe existir como minimo un numero.
    // (?=.*?[#?!@$ %^&*-]) Positive lookahead: De todo lo que viene despues debe existir un caracter especial (numeros y letras no cuentan).
    // .{8,} Como minimo ocho caracteres.
    //#endregion

    if (!emailRegex.test(emailInput.value)) {
        res.send(`<h1>Error: Por favor, ingresa una dirección de correo electrónico válida.</h1> El usuario ${nombre} NO fue agregado.`);
    }else
    if (!passwordRegex.test(passwordInput.value)) {
        res.send(`<h1>Error: La contraseña debe tener al menos 8 caracteres, contener minimo una mayuscula, una minuscula, un numero y un caracter especial.</h1> El usuario ${nombre} NO fue agregado.`);
    }

    cnx.connect(function (){
        cnx.query("select * from usuario where correo = '" +correo+ "'", function (err, result){
            if(err){
                res.send("<h1>ERROR EN LA BASE DE DATOS</h1><br>" + err);
            }else{
                if(result[0]){
                    res.send(`<h1>Error:  Usuario encontrado en la base de datos.</h1> El usuario ${nombre} NO fue agregado.`);
                    console.log(result[0]);
                }
            }
        });
    });

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    console.log(password);
    console.log(salt);
    console.log(hash);

    cnx.connect(function (){
        cnx.query(
            "insert into usuario (nombre, correo, password, rol, edad, urlImagen, type, size) values (?,?,?,?,?,?,?,?)",
            [nombre, correo, hash, rol, edad, nombreFinal, imagen.mimetype, imagen.size],
            function (err, result){
                if(err){
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1><br>" + err);
                }else{
                    if (result.affectedRows == 1){
                        res.redirect(`/usuario?borrado=El usuario ${nombre} fue agregado con exito.`);
                        imagen.mv("./imagenes/" + nombreFinal );
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
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1><br>" + err);
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
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1><br>" + err);
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
                    res.send("<h1>ERROR EN LA BASE DE DATOS</h1><br>" + err);
                }else{
                    res.render("usuario/alta", {roles: result});
                 }
            }
        );
    });
}

function showLoginUser(req, res){
    res.render("usuario/logear");
}

async function loginUser(req, res){
    const {correo, password, url} = req.body;

    /*
        1.  Validar correo v
        2.  Validar contrasena v
        3.  Revisar si el correo ya existe en db v
        4.  Crear SALT
        5.  Hashear contrasena
    */
    //#region emailRegex
    emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    // /^[a-zA-Z0-9._-]+ Multiples caracteres que pueden ser letras minus, mayus, numeros, punto, guion bajo o punto
    // @ un simbolo arroba
    // [a-zA-Z0-9._-]+ Multiples caracteres que pueden ser letras minus, mayus, numeros, punto, guion bajo o punto
    // \. obligatoriamente un punto
    // [a-zA-Z]{2,4} obligatoriamente dos y maximo hasta cuatro letras minus o mayus.
    //#endregion
    //#region passwordRegex
    passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$\.%^&*-]).{8,}$/;
    // (?=.*?[A-Z]) Positive lookahead: De todo lo que viene despues debe existir como minimo una letra mayuscula.
    // (?=.*?[a-z]) Positive lookahead: De todo lo que viene despues debe existir como minimo una letra minuscula.
    // (?=.*?[0-9]) Positive lookahead: De todo lo que viene despues debe existir como minimo un numero.
    // (?=.*?[#?!@$ %^&*-]) Positive lookahead: De todo lo que viene despues debe existir un caracter especial (numeros y letras no cuentan).
    // .{8,} Como minimo ocho caracteres.
    //#endregion

    if (!emailRegex.test(correo)) {
        console.log('Por favor, ingresa una dirección de correo electrónico válida.');
    }else
    if (!passwordRegex.test(password)) {
        console.log('La contraseña debe tener al menos 8 caracteres, contener minimo una mayuscula, una minuscula, un numero y un caracter especial.');
    }

    cnx.connect(function (){
        cnx.query("select * from usuario where correo = '" +correo+ "'", async function (err, result){
            if(err){
                res.send("<h1>ERROR EN LA BASE DE DATOS</h1><br>" + err);
            }else{
                if(result[0]){
                    console.log("Usuario encontrado en la base de datos." + result[0].password);
                    if(await bcrypt.compare(password, result[0].password)){
                        //Empiezo a crear la "Sesion"

                        //transformando la contraseña a Uint8Array
                        const encoder = new TextEncoder();
                        const secret = encoder.encode('JWT_PRIVATE_KEY')

                        //Creando el token
                        const jwtConstructor = new jose.SignJWT(result[0]);
                        const jwt = await jwtConstructor.setProtectedHeader({alg: 'HS256', typ: 'JWT'})
                            .setIssuedAt()
                            .setExpirationTime('1h')
                            .sign(secret)
                        ;

                        const cookiesConfig = {
                            expires: new Date(Date.now()+'7d'*24*60*60*1000),
                            httpOnly: true
                        }

                        res.cookie('jwt', jwt, cookiesConf);

                        //Sesion creada
                        console.log(`Bienvenido ${result[0].nombre} tu contraseña es "${result[0].password}", te redirijo a ${url} Este es tu token: ${jwt}`);
                        return res.status(200).json({ jwt }).redirect(url);
                    }else{
                        console.log("ERROR: contraseña incorrecta.");
                    }
                }else{
                    console.log("Error: Usuario no encontrado en la base de datos.");
                }
            }
        });
    });
}

module.exports = {
    getAllUsers,
    addUser,
    deleteUser,
    updateUser,
    showUpdateUser,
    showAddUser,
    showLoginUser,
    loginUser
};

//debo saber como poder almacenar los resultados dentro de una variable fuera de un callback