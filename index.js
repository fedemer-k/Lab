const express = require("express");
app = express();

/* manejo de rutas */

app.get("/ping", (req, res) =>{
    res.send("<h1>Ultra PONG!</h1>");
});

app.get("/registro", function (req, res){
    res.send("Aqui deberia darse de alta, baja modificacion el usuario");
});



/* levantamiento de server */

app.listen(8000, ()=>{
    console.log("felizmente el server ha iniciado en localhost:8000");
});

