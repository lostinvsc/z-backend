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
const USER = require('./Models/user.js')
const SERVICE = require('./Models/service.js')
const nodemailer = require('nodemailer');

mongoose.connect('mongodb://localhost:27017/hospital_management')

const app = express()
const PORT = process.env.PORT || process.env.PORT_INDEX;
app.use(cors({
    origin: [process.env.FRONTEND1, process.env.FRONTEND2],
    credentials: true,
}))
app.use(bodyParser.json())
app.use(cookieParser())
var user = {};
const logincheck = async (req, res, next) => {
    try {
        let cookie = req.cookies["clientToken"];
        let userEmail = jwt.verify(cookie, process.env.JWT_SECRETKEY)
        user = await USER.findOne({ email: userEmail })

        if (user) {
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



app.post('/getcode', async (req, res) => {
    try {
        let { email } = req.body;

        let oldUser = await USER.findOne({ email: email })

        if (oldUser) {
            return res.json({
                status: false,
                message: "User with this email already exists",
            })
        }
      
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user:process.env.MY_EMAIL ,
                pass: process.env.MY_PASS
            }
        });

        let code = Math.floor(Math.random() * Math.pow(10,6))

        let mailOptions = {
            from: '"z-care" <z.careatyourhome@gmail.com>',
            to: email,
            subject: "Email verification",
            text: `${code}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.json({
                    status: false,
                    message: 'Error sending email',
                });
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            return res.json({
                status: true,
                message: 'Verification code has been sent to your email',
                code: code,
            });
        });

    } catch (error) {

        res.json({
            status: false,
            message: "Something went wrong",
        })
    }
})

app.post('/clientSignup', async (req, res) => {
    try {
        let { email, password } = req.body;
        let data = req.body
        let hashp = await bcrypt.hash(password, 10);
        data['password'] = hashp;

        let user = await USER.create(data)

        if (user) {
            let clientToken = jwt.sign(email, process.env.JWT_SECRETKEY)
            let cookie = res.cookie('clientToken', clientToken)
            
            console.log(clientToken)
            return res.json({
                status: true,
                message: "User regestered successfully",
            })
        }
        return res.json({
            status: false,
            message: "Something went wrong",
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something went wrong",
        })
    }
})
app.post('/clientLogin', async (req, res) => {
    try {
        let { email, password } = req.body;
        let user = await USER.findOne({ email: email })
        let verify = await bcrypt.compare(password, user.password)

        if (verify) {
            let clientToken = jwt.sign(email, process.env.JWT_SECRETKEY)

            res.cookie('clientToken', clientToken)
            return res.json({
                status: true,
                message: "Client logged in successfully",
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
app.post('/message', async (req, res) => {
    try {

        let x = await MESSAGE.create(req.body)

        res.json({
            status: true,
            message: 'Message sent successfully'
        })
    } catch (error) {
        res.json({
            status: false,
            message: error.errors[Object.keys(error.errors)[0]].message
        })
    }
})

app.post('/appointment', logincheck, async (req, res) => {
    try {
        let data = req.body
        data['phone'] = user.phone;
        const appointment = await APPOINTMENT.create(data)

        res.json({
            status: true,
            message: "Appointment received"
        })

    } catch (error) {
        res.json({
            status: false,
            message: "Something went wrong"
        })
    }
})
app.get('/getservice', async (req, res) => {
    try {
        const service = await SERVICE.find({})
        res.json({
            status: true,
            service: service,
        })
    } catch (error) {
        res.json({
            status: false,
            message: "Something went wrong"
        })
    }
})

app.get('/logout', logincheck, async (req, res) => {
    try {

        res.cookie('clientToken', '');
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
app.get('/getadminservice', logincheckadmin, async (req, res) => {
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

// app.get('/delete', async (req, res) => {
  
//     await USER.deleteMany({})
//     res.json('deleted')

// })


app.listen((PORT), () => {
    console.log(`Client app listening at port ${PORT}`)
})

