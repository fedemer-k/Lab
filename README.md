# Lab

Primer proyecto de nodejs express, basado en un el codigo creado por el profesor fernando en una clase de Web II

todo
    Falta mejorar login (cartel de error cuando contrasena incorrecta, usuario no existe.)
    Falta mejorar LOGOUT y testearlo
        Deberia recrear el JWT con un tiempo de caducacion de 1 seg. (por si la cookie no se borra).
        Deberia eliminar la cookie.

    1.Cabezera
        Boton login - Boton singup  / Boton editar usuario + boton logout
    2.TOOLBAR
        Admin   ->  Solicitar turno - Solicitudes Turnos - Turnos - Usuarios/Personas/Agregar Turno - Medicos - Almanaque
        User    ->  Solicitar turno - Solicitudes Turnos - Turnos - Usuarios/Personas/
        Medico  ->  Solicitar turno - Solicitudes Turnos - Turnos
        No user ->  Solicitar turno

    Solicitudes de turno
        Admin:  Como cliente (propios)(Ver-Alta-Baja) - como administrador (todos)(Baja - Modificacion)
        Medico: Como cliente (propios)(Ver-Alta-Baja)
        User:   Como cliente (propios)(Ver-Alta-Baja)

    Turnos
        Admin:  Como cliente (propios)(Ver) - como administrador (todos)(Alta-Baja-Modificacion)
        Medico: Como cliente (propios)(Ver) - Como servicio (todos los asignados a el)(Ver)
        User:   Como cliente (propios)(Ver) -
    
    Vistas:
        Almanaque (deberia mostrar los dias de un mes. Y tener pintados los dias que tiene solicitudes)
            Solicitud de turnos (Al hacer click en un dia, debe mostrar las solicitudes y horarios asignados a ese dia)
        Almanaque (deberia mostrar los dias de un mes. Y tener pintados los dias que tiene turno)
            Turnos (Al hacer click en un dia, debe mostrar los turnos y horarios asignados a ese dia)
        Usuarios
            Listar usuarios - Filtro medicos/admin/usuarios/personas
                Crear turno (admin)
                Agregar matricula (admin)
                Ver Historial Medico (medico)
                Agregar consulta al historial (medico)
            ABM
        Especialidades
            Matriculas
                ABM (admin)

    Si llego agrego lo vip. Si no se va al carajo.

    seria genial tener un footer, pero eso ya seria elegancia la de francia.
        

        





Necesito repasar:
    Promesas: async await
    Callbacks
    ".then"
    "await is only valid in async functions and the top level bodies of modules"
    Diferencia entre ESM import y CJS require (en la documentacion de npmjs package 'jose' se ven dos ejemplos)
    Que carajos es eso de una funcion NEXT?
        Revisar si se pueden crear mas midleware que los comunes.
    NECESITO VER PROMESAS DE CONSULTAS
    TAMBIEN VER CONSULTAS PREPARADAS
    REVISAR CONCEPT ENVIRONMENTS (development or "retail?")
    Como realizar transacciones en MYSQL2
