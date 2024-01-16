const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
//Modulos requeridos para la sección de Login
const bcrypt = require('bcrypt');
const fs = require('fs');

const flash = require('express-flash');
//const session = require('express-session');

//Tambien hacemos el requerimiento de los modulos creados por nosotros mismos
const archivosRouter = require('./routes/archivosRoutes');

const app = express();
const PORT = 3000;  //Puerto para servidor, puede cambiar

// Middleware para procesar datos JSON
app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

//ruta para dirigirse al login cuando inicie el servidor
app.use(express.static(path.join(__dirname, "public"), { index: 'login.html' }));
//app.use(express.static(path.join(__dirname, "public")));


//MANEJO DE USUARIOS
const databasePath = path.join(__dirname, 'data', 'database.json');

app.get("/registrar", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/register.html"));
});


app.post("/registrar", (req, res) => {
    // Obtener datos del cuerpo de la solicitud
    const { username, password, correo } = req.body;

    // Leer la base de datos existente
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));

    // Verificar si el usuario ya existe
    if (Object.values(database).some(user => user.username === username)) {
        return res.status(400).send("El usuario ya existe");
    }

    // Hash de la contraseña antes de almacenarla
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Crear nuevo usuario
    const newUser = {
        username,
        password: hashedPassword,
        correo
    };

    // Generar un nuevo ID para el usuario
    const userId = Object.keys(database).length > 0
        ? (Math.max(...Object.keys(database).map(id => parseInt(id))) + 1).toString()
        : "0";

    // Agregar el nuevo usuario a la base de datos
    database[userId] = newUser;

    // Guardar la base de datos actualizada
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));

    // Redirigir a la página de login
    res.redirect("/login");
});


app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/login.html"));
});

app.post("/login", (req, res) => {
    // Obtener datos del cuerpo de la solicitud
    const { username, password } = req.body;

    // Leer la base de datos existente
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));

    if (username === 'admin' && password === 'admin') {
        return res.redirect("/admin");
    }

    // Verificar si el usuario existe
    const user = Object.values(database).find(user => user.username === username);

    if (!user) {
        return res.status(401).send("Usuario no encontrado");
    }

    // Verificar la contraseña
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).send("Contraseña incorrecta");
    }

    // Credenciales válidas, redirigir a index.html
    res.redirect("/index.html");
});

//ENDPOINTS PARA ADMINISTRADOR
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/admin.html"));
});

// Agrega esta nueva ruta al final de tu archivo app.js
app.get("/admin/users", (req, res) => {
    // Leer la base de datos existente
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));

    // Mapear la lista de usuarios para incluir una propiedad userId
    const usersWithId = Object.keys(database).map((userId) => ({
        userId,
        username: database[userId].username,
        correo: database[userId].correo,
    }));

    // Enviar la lista de usuarios como respuesta
    res.json(usersWithId);
});


app.post("/admin/delete-user/:userId", (req, res) => {
    // Obtener el ID de usuario a eliminar desde los parámetros de la solicitud
    const userIdToDelete = req.params.userId;

    // Leer la base de datos existente
    const database = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));

    // Verificar si el usuario existe
    if (database[userIdToDelete]) {
        // Eliminar al usuario de la base de datos
        delete database[userIdToDelete];

        // Guardar la base de datos actualizada
        fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));

        // Enviar una respuesta exitosa
        res.send("Usuario eliminado exitosamente");
    } else {
        // Enviar una respuesta de error si el usuario no existe
        res.status(404).send("Usuario no encontrado");
    }
});


//Agregamos los endpoints a los que el usuario va a poder acceder
app.use('/archivos', archivosRouter);

//La app inicia a recibir solicitudes mediante el listen
app.listen(PORT, () => {
    console.log(`Servidor web emulado en http://localhost:${PORT}`);
});

module.exports = app;