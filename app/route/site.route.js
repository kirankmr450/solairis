let express = require('express');
let UserType = require('../model/user.model').userType;
let UserRole = require('../model/user.model').userRole;
let siteCtrl = require('../controller/site.controller');
let customerCtrl = require('../controller/customer.controller');
let authCtrl = require('../controller/auth.controller');
let Error = require('../error/error');

let router = express.Router();

// All user API requires authentication
router.all('*', authCtrl.authenticateMW);

// Create a new site
// Caller must be a customer admin
router.post('/', (req, res, next) => {
    if (req.user.role !== UserRole.External.CustomerAdmin) 
        return next(Error.ForbiddenError('Insufficient privileges'));
    return siteCtrl.createNewSite(req, res, next);
});


// Fetch site details
router.get('/:siteid', async (req, res, next) => {
    if (req.user.type === UserType.External && req.user.role !== UserRole.CustomerAdmin) {
        // Check if user has right privileges.
        try {
            var customer = await customerCtrl.getCustomerById(req.user.customerId);
            var users = customer.users.filter(user => user.userid === req.user.id);
            if (users.length === 0) throw Error.ForbiddenError('Insufficient privileges');
            var sites = users[0].sites.filter(site => site.)
        } catch (e) { next(e); }
            
        return next(Error.ForbiddenError('Insufficient privileges'));
    }
    return siteCtrl.getSite(req, res, next);
});


// User list can be fetched only by admin.
router.get('/internal', (req, res, next) => {
//    if (!userCtrl.hasAdminPrivileges(req.user)) return next(Error.ForbiddenError('Insufficient permission.'));
    return userCtrl.getAllInternalUser(req, res, next);
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
