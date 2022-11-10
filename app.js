const express =require('express')
const dotenv = require('dotenv')
const logger = require('morgan')
const path = require('path')
const expressLayouts = require('express-ejs-layouts')


const {check, validationResult} = require('express-validator')
const nocache = require("nocache");
const app = express()
const db = require('./config/connection')
const session = require('express-session')
const fileUpload = require('express-fileupload')


const userRouter = require('./routes/users')
const adminRouter = require('./routes/admin')


dotenv.config({path:'config.env'})
const PORT = process.env.PORT||8080

app.use(expressLayouts)
app.set('layout', './layout/layout')
app.set('view engine', 'ejs')

// app.set('views', path.resolve(__dirname,"views/layout"));


app.use(express.static(path.join(__dirname, 'public')))

app.use(logger('dev'))
app.use(express.urlencoded({extended: false}))
app.use(fileUpload())
app.use(session({secret:"Key",cookie:{maxAge:600000}}))
app.use(nocache());


db.connect((err)=> {
    if(err) console.log("Connection Error"+err);
    else console.log('Database Connecter to port 27017');
})

app.use('/',userRouter)
app.use('/admin',adminRouter)


app.listen(PORT, ()=> {
    console.log(`server is running on http://localhost:${PORT}`);
})