require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-Parser')
const cookieParser = require('cookie-Parser')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const MESSAGE = require('./Models/message.js')
const APPOINTMENT = require('./Models/appointment.js')
const ADMIN = require('./Models/admin.js')
const SERVICE = require('./Models/service.js')


mongoose.connect('mongodb://localhost:27017/hospital_management')

const app = express()
const PORT = process.env.PORT_ADMIN | process.env.PORT;
app.use(cors({
    origin: [process.env.FRONTEND1, process.env.FRONTEND2],
    credentials: true,
}))
app.use(bodyParser.json())
app.use(cookieParser())

const logincheckadmin = async (req, res, next) => {
    try {
        let cookie = req.cookies["adminToken"];
        let adminEmail = jwt.verify(cookie, process.env.JWT_SECRETKEY)
        let admin = await ADMIN.findOne({ email: adminEmail })



        if (admin) {
            next()
        } else {
            res.json({
                status: false,
                message: "Login Required"
            })
        }

    } catch (error) {
        res.json({
            status: false,
            message: "Login Required"
        })
    }
}



app.get('/adminlogout', logincheckadmin, async (req, res) => {
    try {

        res.cookie('adminToken', '');

        res.json({
            status: true,
            message: "Logged out successfully"
        })

    } catch (error) {
        res.json({
            status: false,
            message: "Something went wrong"
        })
    }
})

app.post('/createadmin', async (req, res) => {
    try {
        let { email, password } = req.body;

        let oldUser = await ADMIN.findOne({ email: email })

        if (oldUser) {
            return res.json({
                status: false,
                message: "User with this email already exists",
            })
        }
        let hashp = await bcrypt.hash(password, 10);


        let user = await ADMIN.create({ email: email, password: hashp })

        if (user) {
            let adminToken = jwt.sign(email, process.env.JWT_SECRETKEY)
            let cookie = res.cookie('adminToken', adminToken)

            return res.json({
                status: true,
                message: "Admin regestered successfully",
            })
        }
        return res.json({
            status: false,
            message: "Something went wrong",
        })

    } catch (error) {

        res.json({
            status: false,
            message: "Something went wrong",
        })
    }
})

app.post('/adminLogin', async (req, res) => {
    try {

        let { email, password } = req.body;
        let user = await ADMIN.findOne({ email: email })

        if (!user) {
            return res.json({
                status: false,
                message: "Admin not found",
            })

        }
        let verify = await bcrypt.compare(password, user.password)

        if (verify) {
            let adminToken = jwt.sign(email, process.env.JWT_SECRETKEY)

            res.cookie('adminToken', adminToken)
            return res.json({
                status: true,
                message: "Admin logged in successfully",
            })
        }
        res.json({
            status: false,
            message: "Invalid credentials",
        })


    } catch (error) {
        res.json({
            status: false,
            message: "Something went wrong",
        })
    }
})

app.get('/getappointments', logincheckadmin, async (req, res) => {
    try {

        let appointments = await APPOINTMENT.find({})

        res.json(appointments)

    } catch (error) {
        res.json(["Something went wrong"])
    }
})
app.get('/getmessages', logincheckadmin, async (req, res) => {
    try {

        let messages = await MESSAGE.find({})
        res.json(messages)
    } catch (error) {
        res.json(["Something went wrong"])
    }
})
app.post('/addservice', logincheckadmin, async (req, res) => {
    try {
        let service = await SERVICE.create(req.body)

        res.json({
            status: true,
            message: "Added successfully",
        })
    } catch (error) {
        res.json({
            status: false,
            message: "Added successfully",
        })
    }
})
app.get('/getservice', logincheckadmin, async (req, res) => {
    try {
        let service = await SERVICE.find({})
        res.json(service)
    } catch (error) {
        res.json(["Something went wrong"])
    }
})
app.put('/removeservice', logincheckadmin, async (req, res) => {
    try {
        let { id } = req.body;
        await SERVICE.findByIdAndDelete(id)
        res.json({
            status: true,
            message: "Removed successfully",
        })
    } catch (error) {
        res.json({
            status: false,
            message: "Something went wrong",
        })
    }
})
app.put('/removeappointment', logincheckadmin, async (req, res) => {
    try {
        let { id } = req.body;
        await APPOINTMENT.findByIdAndDelete(id)
        res.json({
            status: true,
            message: "Appointment removed successfully",
        })
    } catch (error) {
        res.json({
            status: false,
            message: "Something went wrong",
        })
    }
})

app.listen((PORT), () => {
    console.log(`Admin app listening at port ${PORT}`)
})
