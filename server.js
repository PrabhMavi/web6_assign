/*********************************************************************************
*  WEB700 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Prabhjot Kaur Student ID: 148991219 Date: 23/07/2022
*  Heroku link: https://glacial-journey-73393.herokuapp.com/
*  Github link: https://github.com/PrabhMavi/web-app.git
********************************************************************************/ 



var collegedata= require('./modules/collegeData')

// adding middlewares to the app
var express= require('express')
var multer=require('multer')
const exphbs = require('express-handlebars');
var path=require('path')    
var upload = multer();
var app= express()
const Sequelize = require('sequelize');
// using array to append the JSON file
app.use(upload.array()); 

// Add middleware for static contents
app.use(express.static('views'))
app.use(express.static('modules'))

app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

var sequelize = new Sequelize('d3ss6k28bq4osk', 'cuvhnwkeqmbpwa', '697d19f6395c4279c6c3277a7978d048aaf2f9cbea4279a5d54b4475fbd8eec6', {
    host: 'ec2-44-208-88-195.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    }, 
    query:{ raw: true }
});


var HTTP_PORT = process.env.PORT || 8080;


//to be used when loading the form
app.use(express.urlencoded({ extended: true }));

app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));    
    next();
});

//adding a helper
app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    helpers: { 
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') + 
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        }
    ,
    
    equal: function (lvalue, rvalue, options) {
        if (arguments.length < 2 ){
            throw new Error("Handlebars Helper equal needs 2 parameters");
        }
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    }
}
}));
app.get('/students', (req, res) => {

    if( req.query.course &&  req.query.course !== undefined){
        let courseParas = req.query.course;
        console.log(courseParas);

         collegedata.getStudentsByCourse(courseParas).then(course => {
                res.render('students',{
                    data: course,
                    layout: "main"
                })
                console.log("courses data retrieved")
            }).catch(err => {
                err = {
                message : "no results"}
                res.render("students", {message: "no results"})})
           
        }
        else {
            collegedata.getAllStudents().then(students => {
            // res.send(students)
            res.render("students", {
                data: students,
                layout: "main"});
            }).catch(err => {
                err = {
                message : "no results"}
            // res.send()
            res.render("students", {message: "no results"});
        })
    
}})



app.get("/courses", (req, res) => {
    collegedata.getCourses().then(courses => {
    // res.send(courses)
    if (courses.length>0){
        res.render('courses',{
            data: courses,
            layout: "main"
        })
        console.log("Get courses called successfully" )
    }
    else{
        res.render("courses", {message: "no results"})
    }
    
    }).catch(err => {
        res.render("courses", {message: "no results"})
})
});


app.get("/student/:studentNum", (req, res) => {

    // initialize an empty object to store the values
    let viewData = {};

    collegedata.getStudentByNum(req.params.studentNum).then((data) => {
        if (data) {
            viewData.student= (data); //store student data in the "viewData" object as "student"
        console.log(viewData)
        } else {
            viewData.student = null; // set student to null if none were returned
        }
    }).catch(() => {
        viewData.student = null; // set student to null if there was an error 
    })
    .then(collegedata.getCourses())
    .then((data) => {
        viewData.courses = data; // store course data in the "viewData" object as "courses"

        // loop through viewData.courses and once we have found the courseId that matches
        // the student's "course" value, add a "selected" property to the matching 
        // viewData.courses object

        for (let i = 0; i < viewData.courses.length; i++) {
            if (viewData.courses[i].courseId == viewData.student.course) {
                viewData.courses[i].selected = true;
            }
        }

    }).catch(() => {
        viewData.courses = []; // set courses to empty if there was an error
    })
    .then(() => {
        console.log(viewData)
        if (viewData.student == null) { // if no student - return an error
            res.status(404).send("Student Not Found");
        } else {
            
            res.render('student', 
            {   
                viewData: viewData, 
            layout: "main"}); // render the "student" view
        }
    });
});


app.get("/student/delete/:studentNum",(req,res)=>{
    console.log('student delete called');
    collegedata.deleteStudentByNum(req.params.studentNum).then(()=>{
        collegedata.getAllStudents().then((students)=>{
            res.render('students',{
                        data:students})
       
        }).catch(()=>{
            res.status(500).send("Unable to Remove Student / Student not found")
    })
})})


app.get("/course/:courseId",(req,res)=>{
    console.log("getting courses by id ")
    let coursenum=req.params.courseId
    console.log(coursenum)
        collegedata.getCourseById(coursenum).then(courses =>{
                if(cours.length>0){
                res.render('course',{
                data: courses
            })
                }
                else{
                    res.status(404).send("Course Not Found")
                }
           
        }).catch(err=>
            {
                console.log('Course Not Found')
            })
}) ;

//get method to get the form for adding new student

app.get("/students/add",(req,res)=>
{
    console.log('student add called')
    collegedata.getCourses().then((courses)=>{
        if(courses.length>0){
            console.log(courses)
            res.render('addStudent',{
                data: courses,
                layout:"main"
            })
        }
        else{
            res.render('addStudent',{
                data: [],
                layout:"main"
            })  
        }
       
    }).catch(()=>
    {
        res.render("addStudent", {message: "no results"}) 
    })
});

app.get("/courses/add",(req,res)=>
{
    console.log('course add called')
    // res.sendFile(path.join(__dirname,"./views/addStudent.html"))
    res.render('addCourse',{
        layout:"main"
    })
}) ;




//posting the message after adding the student
app.post("/students/add",(req,res)=>{
    collegedata.addStudent(req.body).then(()=>{
        res.redirect("/students")  
    }
    ).catch(err=>{
        res.send(err)
    })
});

app.post("/courses/add",(req,res)=>{
    collegedata.addCourse(req.body).then(()=>{
        res.redirect("/courses")  
    }
    ).catch(err=>{
        res.send(err)
    })
})

app.post("/student/update",(req,res)=>{
    collegedata.updateStudent(req.body).then(()=>{   
        res.redirect("/students")
    }).catch(err=>{
        res.send(err)
    })

})

app.post("/course/update",(req,res)=>{
    //calling /course/update
    console.log("calling course update")
    console.log(JSON.stringify(req.body))
    collegedata.updateCourse(req.body).then(()=>{
        
        res.redirect("/courses")
    }).catch(err=>{
        res.send(err)
    })

})

app.get("/", (req, res) => {
    // res.sendFile(path.join(__dirname,"./views/home.html"));
    res.render('home', {
        // data: someData,
        layout: "main" // do not use the default Layout (main.hbs)
    });
});

app.get("/home", (req, res) => {
    // res.sendFile(path.join(__dirname,"./views/home.html"));
    res.render('home', {
        // data: someData,
        layout: "main" // do not use the default Layout (main.hbs)
    });
});

app.get("/about", (req, res) => {
    //res.sendFile(path.join(__dirname,"./views/about.html"));
    res.render('about',{
        layout:"main"
    })
});

app.get("/htmlDemo", (req, res) => {
    //res.sendFile(path.join(__dirname,"./views/htmlDemo.html"));
    res.render('htmlDemo',{
        layout:"main"
    })
});

app.get('*', function(req, res){
    res.send('Error: Page Not Found');
});

// setup http server to listen on HTTP_PORT
collegedata.initialize()
.then(app.listen(HTTP_PORT, ()=>{ 
    console.log("server listening on port: " + HTTP_PORT)
}))
.catch(err => {
    console.log("Error: Can't establish the database connection")
})


