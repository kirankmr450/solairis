var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var cors = require('cors');
let mongoose = require('mongoose');

let Error = require('./app/error/error');
let authCtrl = require('./app/controller/auth.controller');

let authRoute = require('./app/route/auth.route');
let userRoute = require('./app/route/user.route');
let customerRoute = require('./app/route/customer.route');

mongoose.connect('mongodb://localhost:27017/solairis', {useNewUrlParser: true});

var app = express();
// TODO: Configure this properly when domain name is registered.
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(authCtrl.initialize());
// Routes
app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/customer', customerRoute);

// Catch 404 error
app.use((req, res, next) => {
    res.status(404).json({message: 'Resource not found'});
});

//Catch all error
app.use((err, req, res, next) => {
    console.log("Error at Index.JS: ", err);
    if (!(err instanceof Error)) return res.status(500).json({message: 'Server Error'});
    res.status(err.code).json(err.response);
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.info(`Server listening on port ${PORT}.`));
