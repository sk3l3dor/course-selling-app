const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const { ADDRCONFIG } = require('dns');

const SECRET_KEY_ADMIN = "AdMiNs3Cr3T";
const app = express();
app.use(bodyparser.json());


//MONGO DB CONNECTION STRING
//mongodb+srv://rohit:%40%40A1b2c3d4e5@cluster0.vau0q8e.mongodb.net/
//mongodb+srv://rohit:%40%40A1b2c3d4e5@cluster0.vau0q8e.mongodb.net/

mongoose.connect("mongodb+srv://rohit:%40%40A1b2c3d4e5@cluster0.vau0q8e.mongodb.net/");

// schema

const adminSchema = mongoose.Schema({
    username: String,
    password: String
});

const courseSchema = mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    imageLink: String,
    published: Boolean
});

//  collection

const Admin = mongoose.model("admins", adminSchema);
const Course = mongoose.model("courses", courseSchema);

//Admin authentication middleware

const adminAuthenticationMiddleware = (req,res,next) => {
    const headerString = req.headers.split(' ');
    const jwtToken = headerString[1];
    if (jwtToken) {
        jwt.verify(jwtToken, SECRET_KEY_ADMIN,(err, user)=> {
            if (err) {
                return res.sendStatus(400);
            }
            req.user = user;
            next();
        })
    }
    else {
        res.sendStatus(401);
    }

}





//Creates new admin account
app.post('/admin/signup', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (admin) {
        res.status(403).send({
            message: "Admin already exists"
        })
    }
    else {
        const newAdmin = new Admin({
            username: username,
            password: password
        })
        await newAdmin.save();
        const token = jwt.sign({ username: username, role: 'admin' }, SECRET_KEY_ADMIN);
        res.status(200).json({
            message: "Admin created succesfully", token: token
        });
    }
});

// Admin login route

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.headers;
    const admin = await Admin.findOne({ username: username, password: password });
    if (admin) {
        const token = jwt.sign({ username: username, role: 'admin' }, SECRET_KEY_ADMIN, { expiresIn: '1h' });
        res.status(200).json({ message: 'Logged in succesfully', token: token });
    }
    else {
        res.status(400).json({ message: 'Enter the right credentials' });
    }
});


//admin creates a new course

app.post('/admin/courses', adminAuthenticationMiddleware, async (req, res) => {
  
    const course = new Course(req.body);
    await course.save();
    res.json({ message: "course created succefully", courseId: course.id });
});

//admin editing a course through spedific url

app.put('/admin/courses/:courseId')





    















app.listen(3000, () => {
    console.log("server started on port 3000");
})
