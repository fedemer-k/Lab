/*Esta version agrega soporte al sistema de logueos de usuario */

/*Selecciono la base de datos a utilizar*/
USE `sistemausuario`;

/*agrego los campos para dar soporte al logeo de usuarios. */
ALTER TABLE `usuario`
	ADD COLUMN `correo` VARCHAR(320) NOT NULL DEFAULT '0' AFTER `nombre`,
	ADD COLUMN `password` VARCHAR(50) NOT NULL DEFAULT '0' AFTER `correo`;

/* Bcrypt no me termina devolviendo un hash de 60 caracteres. 50 son insuficientes. */
ALTER TABLE `usuario`
	CHANGE COLUMN `password` `password` VARCHAR(60) NOT NULL DEFAULT '0' COLLATE 'utf8mb4_general_ci' AFTER `correo`;

/*Hashing de todas las contraseñas existentes de todos los usuarios. 
De ahora en mas no almacenamos mas las contraseñas en texto plano.
Recordar que todas las otras cuentas de prueba tienen la contraseña Test123$ */
/* Federico */
UPDATE `sistemausuario`.`usuario` SET `password`='$2b$12$O85Dj8Kg4IM2QbpICDyZm.dT8JPQdyFpe766iE3SZwAaeG2UQ40DS' WHERE  `id`=9;
/* Fernando saez */
UPDATE `sistemausuario`.`usuario` SET `correo`='fernandosaez@hotmail.com' WHERE  `id`=17;
UPDATE `sistemausuario`.`usuario` SET `password`='$2b$12$font6brQtK2PdocE7tOe9uuTeyPFZ90PHjEomy9wVG47226hMyyI6' WHERE  `id`=17;
/* Max Verstappen */
UPDATE `sistemausuario`.`usuario` SET `correo`='maxverstappen@hotmail.com' WHERE  `id`=25;
UPDATE `sistemausuario`.`usuario` SET `password`='$2b$12$7MWFcwvWVQEez10kDHj.WeA/q1cdTrO6s5FAapYiPxckmCyykDOwa' WHERE  `id`=25;
/* Superman */
UPDATE `sistemausuario`.`usuario` SET `correo`='super@hotmail.com' WHERE  `id`=26;
UPDATE `sistemausuario`.`usuario` SET `password`='$2b$12$W0Iw9kkjRE9pT/mimn8t6euHKOzt2pA6jxSFoDbPyT9gOwKWoP1um' WHERE  `id`=26;
/* Spiderman */
/* spider@hotmail.com */
UPDATE `sistemausuario`.`usuario` SET `password`='$2b$12$uAxr2I1.I3zvagNPuLkecuD0G7iXVTVxwJcX4LwVi4rkGQwQ90S4O' WHERE  `id`=28;