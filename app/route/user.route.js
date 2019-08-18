let express = require('express');
let userCtrl = require('../controller/user.controller');
let authCtrl = require('../controller/auth.controller');
let Error = require('../error/error');

let router = express.Router();

// All user API requires authentication
//router.all('*', authCtrl.authenticateMW);

// User list can be fetched only by admin.
router.get('/internal', (req, res, next) => {
//    if (!userCtrl.hasAdminPrivileges(req.user)) return next(Error.ForbiddenError('Insufficient permission.'));
    return userCtrl.getAllInternalUser(req, res, next);
});

// Create a new internal user
// External user will be created via Customer route
router.post('/', (req, res, next) => {
    return userCtrl.createInternalUser(req, res, next);
});

// User details by userid can be fetched by admin
// Non-admin user can fetch details about himself.
router.get('/:userid', (req, res, next) => {
//    if (userCtrl.hasAdminPrivileges(req.user) || (req.user && req.user.id != req.params.userid)) {
        return userCtrl.getUser(req, res, next);
//    } else {
//        return next(Error.ForbiddenError('Insufficient permission.'));
//    }
});

// All users can be updated by admin
// Non-admin user can update himself.
router.put('/:userid', (req, res, next) => {
//    if (userCtrl.hasAdminPrivileges(req.user) || (req.user && req.user.id != req.params.userid)) {
        return userCtrl.updateUser(req, res, next);
//    } else {
//        return next(Error.ForbiddenError('Insufficient permission.'));
//    }
});

// A user can be activated by admin only
router.post('/activate/:userid', (req, res, next) => {
    return userCtrl.activateDeactivateUser(req, res, next, true);
});

// A user can be deactivated by admin only
router.post('/deactivate/:userid', (req, res, next) => {
    return userCtrl.activateDeactivateUser(req, res, next, false);
});

module.exports = router;
