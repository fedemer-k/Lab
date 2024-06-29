USE `practica`;
/*cambio de nombre las tablas */
RENAME TABLE `especialidades` TO `rol`;
RENAME TABLE `medicos` TO `usuario`;

/*tambien cambio de nombre el campo especialidad de usuario por rol*/
ALTER TABLE `usuario`
	CHANGE COLUMN `especialidad` `rol` INT(11) NOT NULL AFTER `nombre`;
ALTER TABLE `rol`
	CHANGE COLUMN `descripcion` `rol` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_general_ci' AFTER `id`;

/*Por ultimo cambio el nombre de la db a SistemaUsuario */
CREATE DATABASE `SistemaUsuario` /*!40100 COLLATE 'latin1_swedish_ci' */;
RENAME TABLE `practica`.`rol` TO `SistemaUsuario`.`rol`, `practica`.`usuario` TO `SistemaUsuario`.`usuario`;
DROP DATABASE `practica`;



