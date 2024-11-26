//#region Mysql2
const mysql = require("mysql2/promise");
const cnxConfig = { 
	host:     process.env.DB_HOST, 
	database: process.env.DB_DATABASE, 
	user:     process.env.DB_USER, 
	password: process.env.DB_PASS
};
//#endregion
//#region JsonWebToken (jose)
//Sirve para crear un token y enviarlo al usuario para que el lo retorne adjuntado a su proxima peticion.
const jose = require('jose');
//#endregion

async function isAuthenticatedUser(req, res, next){ //VER 5.0 
    const { jwt } = req.cookies;
    if(!jwt){
        console.log("usuario no tiene cookie jwt");
        return next();
        // Caso no inicio sesión
    } 
    
    // Transformando la contraseña de jwt a Uint8Array
    const encoder = new TextEncoder();
    const secret = encoder.encode(process.env.JWT_PRIVATE_KEY);
    
    try{
        // Intentando obtener el jwt 
        const jwtData = await jose.jwtVerify(jwt, secret);
        console.log("SUCCESS:SESSION: 1 cookie JWT encontrada y validada. INCOMING COOKIE:");
        
        // Buscando el usuario en base de datos para corroborar su existencia 
        let connection;
        try{
            connection = await mysql.createConnection(cnxConfig);
            const [result] = await connection.execute("SELECT * FROM usuario WHERE id_usuario = ?", [jwtData.payload.id_usuario]);
            if(result.length > 0){
                console.log(`SUCCESS:SESSION: 1.2 Usuario encontrado: ${result[0].nombres} tiene cookie y JWT valido, fue guardado en req.user:`);
                
                // Verificar si es administrador 
                const [admin] = await connection.execute("SELECT * FROM administrador WHERE id_usuario = ? AND activo = 1;", [jwtData.payload.id_usuario]);
                result[0].administrador = admin.length > 0 ? 1 : 0;
                
                // Verificar si es médico 
                const [medico] = await connection.execute("SELECT * FROM medico WHERE id_usuario = ? AND activo = 1", [jwtData.payload.id_usuario]); 
                result[0].medico = medico.length > 0 ? 1 : 0;
                
                req.user = result[0];
            }else{
                console.log(`FAIL:SESSION: 1.2 Usuario NO encontrado en db: ${jwtData.payload.nombre} tiene cookie y JWT valido.`);
                return res.status(200).redirect("/usuario/logout");
            }
        }catch(err){
            return res.status(500).render("error", {user: req.user, error: `ERROR EN LA BASE DE DATOS ${err}`});
        }finally{
            if(connection){
                await connection.end();
            }
        }
    }catch(err){
        if(err.message === 'JWTExpired: "exp" claim timestamp check failed'){
            console.log("FAIL:SESSION 1 JWT sesión ha expirado");
        }else{
            console.log("FAIL:SESSION 1 EXPLOTO EL JWTVERIFY: " + err);
        }
    }finally{
        return next(); // En cualquier caso, continuar con la siguiente middleware
    }
}

module.exports = isAuthenticatedUser;