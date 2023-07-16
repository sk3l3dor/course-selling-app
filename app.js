const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const { ADDRCONFIG } = require('dns');

const SECRET_KEY_ADMIN = "AdMiNs3Cr3T";
const SECRET_KEY_USER = "UsErSs3Cr3T";
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

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    purchasedCourses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]
})

//  collection

const Admin = mongoose.model("admins", adminSchema);
const Course = mongoose.model("courses", courseSchema);
const User = mongoose.model("users", userSchema);

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

//User Authentication Middleware

const userAuthenticationMiddleware = (req, res, next) => {
    // const { username, password } = req.headers;
    // const user = User.find({ username: username, password: password });
    // if (user) {
    //     next();
    // }
    // else {
    //     res.status(400).json({ message:'Enter the right credentials' });
    // }

    const token = req.headers.split(' ')[1];
    jwt.verify(token, SECRET_KEY_USER, (err, user) => {
        if (err) {
            res.status(400).json({ message: 'Enter the right credentials' });
        }
        else {
            req.user = user;
            next();
        }
    })    
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

app.put('/admin/courses/:courseId', adminAuthenticationMiddleware, async (req, res) => {
    const courseid = req.params.courseId;
    const courseUpdate = await Course.updateOne({ id: courseid }, { $set: { title: req.body.title, description: req.body.description, price: req.body.price, imageLink: req.body.imageLink, published: true } });
    if (courseUpdate) {
        res.json({ message: 'course Updated succesfully' });
    }
    else {
        res.status(400).json({ message: 'course not found' });
    }
});

//admin get all courses route

app.get('/admin/courses', adminAuthenticationMiddleware, async (req, res) => {
    const allCourses = await Course.find({});
    if (allCourses) {
        res.status(200).json(allCourses);
    }
    else {
        res.status(404).json({ message: "No courses found" });
    }
});

// New User signup route
app.post('/user/signup', (req, res) => {
    const { username, password } = req.body;
    const user = user.find({ username: username });
    if (user) {
        res.status(400).json({ message: 'username taken' });
    }
    else {
        const jwtToken = jwt.sign({ username: username, role: 'user' }, SECRET_KEY_USER);
        const newUser = new User(req.body);
        newUser.save();
        res.status(200).json({ message: 'User created successfully', token: jwtToken });
    }
    
});

// User Login route

app.post('/user/login', (req, res) => {


    const { username, password } = req.headers;
    const user = User.findOne({ username: username, password: password });
    if (user) {
        const jwtToken = jwt.sign({ username: req.headers.username, role: 'user' }, SECRET_KEY_USER, { expiresIn: '1h' });
        res.status(200).json({ message: 'Logged in Succesfully', token: jwtToken });
    }
    else {
        res.status(400).json({ message: '' })
    }
});


//Users get all Courses route

app.get('/users/courses', userAuthenticationMiddleware, async (req, res) => {
    const allCourses = await Course.find({});
    if (allCourses) {
        res.status(200).json(allCourses);    
    }
    else {
        res.status(404).send({
            message: 'No courses found'
        })
    }
    
});

// USer purchsing a course logic

app.post('/users/courses/:courseId', userAuthenticationMiddleware, async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    if (course) {
        const user = await User.findOne({ username: req.params.username });
        if (user) {
            user.purchasedCourses.push(course);
            await user.save();
            res.json({ message: 'course purchased successfully' });
        } else {
            res.status(403).json({ message: 'User not Found' });
        }
    }
}
);

//get all USER purchased courses route

app.get('/users/purchasedCourses', userAuthenticationMiddleware, async (req, res) => {
    const user = await User.findOne({ username: req.user.username }).populate('purchasedCourses');
    if (user) {
        res.json({ purchasedCourses: user.purchasedCourses || [] });
    }
    else {
        res.send({ message: "user not found" })
    }
});













    















app.listen(3000, () => {
    console.log("server started on port 3000");
})
