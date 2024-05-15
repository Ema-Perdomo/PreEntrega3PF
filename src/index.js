import env_var from './dotenv.js';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import messageModel from './models/messages.js';
import indexRouter from './routes/indexRouter.js';
import initializePassport from './config/passport/passport.js';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import { __dirname } from './path.js';
import dotenv from 'dotenv';



//Configuraciones.
const app = express()
const PORT = 8080
dotenv.config()

//Server
const server = app.listen(PORT, () => {
    console.log(`Server on port: ${PORT}`)
})

const io = new Server(server) //En io declaro un nuevo servidor de socket.io

//Connection DB
//Index es nuestro punto de conexion al servidor en la nube
//(Ojo con poner la password correcta)
mongoose.connect(env_var.mongo_url)
    .then(() => console.log("Conectado a la base de datos"))
    .catch(error => console.log(error))
    

//--------------------------------------------------------------------------------
//----------------- Middlewares (comunicación)--------------------------------
//--------------------------------------------------------------------------------
app.use(express.json())                     //Permite poder ejecutar JSON
app.use(session({                       //Permite trabajar con sessiones    
    secret: env_var.session_secret,             //Firma la session para que no sea modificada por el cliente
    resave: true,                       //Guarda la session cuando se recarga la página y cuando reinicio
    store: MongoStore.create({
        mongoUrl: env_var.mongo_url,
        ttl: 600, //Tiempo de vida de la session(en segundos)

    }),        //Guarda la session en la base de datos,               
    saveUninitialized: true
}))
app.engine('handlebars', engine())              //Implemento handlebars para utilizarlo en mi app
app.set('view engine', 'handlebars')            //Voy a utilizar handlebars para las vistas(views) de mi app 
app.set('views', __dirname + '/views')          //Las views van a estar en dirname + /views
app.use(cookieParser(env_var.cookie_Secret))    //Permite trabajar con cookies

//Passport
initializePassport()
app.use(passport.initialize())  //Delego toda la configuración de inicializar y registrar la session del user a passport
app.use(passport.session()) 

//--------------------------------------------------------------------------------
//------------------------------------Rutas---------------------------------------
//--------------------------------------------------------------------------------
app.use('/', indexRouter)

//Routes Cookies
app.get('/setCookies', (req, res) => {
    res.cookie('CookieCookie', 'Esto es una cookie :D', { maxAge: 30000000, signed: true }).send('Cookie seteada')
    //Signed: firmada para que no sea modificada por el cliente  
})
app.get('/getCookies', (req, res) => {
    //Traigo solo cookies firmadas (signed) en mi servidor
    res.send(req.signedCookies)
})
//Elimino cookies
app.get('/deleteCookies', (req, res) => {
    res.clearCookie('CookieCookie').send('Cookie eliminada')
    //res.Cookie('CookieCookie', '', {expires: new Date(0)})
})
//Session Routes 
app.get('/session', (req, res) => {
    if (req.session.counter) {
        req.session.counter++
        res.send(`Sos el usuario N°: ${req.session.counter} en ingresar a la página.`)
    } else {
        req.session.counter = 1
        res.send('Bienvenido. Sos el primer usuario en ingresar a  la página.')
    }
})

app.post('/login', (req, res) => {
    const { email, password } = req.body

    if (email === "admin@admin.com" && password === "admin") {
        //Guardo en session el email y password
        req.session.email =  email 
        req.session.password =  password 

        res.send('Login exitoso')
    }else{
        res.send('Login incorrecto')
    }
    
})


//socket es un cliente escuchando
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado con socket.io')


    socket.on('mensaje', async (mensaje) => {
        try {
            await messageModel.create(mensaje)
            const mensajes = await messageModel.find()
            io.emit('mensajeLogs', mensajes)
        } catch (error) {
            io.emit('mensajeLogs', error)
        }

    })
})

