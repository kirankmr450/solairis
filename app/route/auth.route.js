let express = require('express');
let authCtrl = require('../controller/auth.controller');

let router = express.Router();

// Not supported
// New user cannot register itself
// Please use User.CreateUser() which can be invoked by admin
router.post('/register', (req, res, next) => {
    return authCtrl.register(req, res, next);
});

router.post('/login', (req, res, next) => {
    return authCtrl.login(req, res, next);
});

// Reset password requires user authentication
router.post('/resetpassword/:userid', authCtrl.authenticateMW, (req, res, next) => {
    return authCtrl.resetPassword(req, res, next);
});

// No support for logout.
// Client should just dismiss the token.
//router.post('/logout', (req, res) => {
//    return authCtrl.logout(req, res);
//});

module.exports = router;
