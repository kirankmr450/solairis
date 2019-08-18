let express = require('express');
var UserType = require('../model/user.model').userType;
var UserRole = require('../model/user.model').userRole;
let customerCtrl = require('../controller/customer.controller');
let authCtrl = require('../controller/auth.controller');
let Error = require('../error/error');

let router = express.Router();

// All user API requires authentication
router.all('*', authCtrl.authenticateMW);

// Create a new customer
// Only Root or Internal-admin can create a new customer
router.post('/', (req, res, next) => {
    // Throw error, if it is an external user OR
    // If the internal user is an operator.
    if (req.user.type === UserType.External ||
       req.user.role === UserRole.Internal.Operator) return next(Error.ForbiddenError('Insufficient privileges'));
    return customerCtrl.createCustomer(req, res, next);
});

// Activate a customer
// Can be done by root/internal-admin only
router.post('/activate/:customerid', (req, res, next) => {
    // Throw error, if it is an external user OR
    // If the internal user is an operator.
    if (req.user.type === UserType.External ||
       req.user.role === UserRole.Internal.Operator) return next(Error.ForbiddenError('Insufficient privileges'));
    return customerCtrl.activateCustomer(req, res, next);
});

// Deactivate a customer
// Can be done by root/internal-admin only
router.post('/deactivate/:customerid', (req, res, next) => {
    // Throw error, if it is an external user OR
    // If the internal user is an operator.
    if (req.user.type === UserType.External ||
       req.user.role === UserRole.Internal.Operator) return next(Error.ForbiddenError('Insufficient privileges'));
    return customerCtrl.deactivateCustomer(req, res, next);
});

// Customer detailed can be fetched by Root or Internal User
// External user can fetch his parent customer details
router.get('/:customerid', (req, res, next) => {
    if (req.user.type === UserType.External && req.user.customerId != req.params.customerid) 
        return next(Error.ForbiddenError('Insufficient privileges'));    
    return customerCtrl.getCustomerById(req, res, next);
});

// All users can be updated by admin
// Non-admin user can update himself.
router.put('/:userid', (req, res, next) => {
//    if (userCtrl.hasAdminPrivileges(req.user) || (req.user && req.user.id != req.params.userid)) {
        return customerCtrl.updateUser(req, res, next);
//    } else {
//        return next(Error.ForbiddenError('Insufficient permission.'));
//    }
});

// Create user under the current customer.
// Here 'current customer' means parent-customer of the current logged-in user.
router.post('/users', (req, res, next) => {
    if (req.user.type !== UserType.External || req.user.role === UserRole.External.CustomerAdmin) 
        return next(Error.ForbiddenError('Insufficient privileges'));
    return customerCtrl.createUser(req, res, next); 
});

// Fetch all users under the current logged-in user's parent customer
// To be used by External user
router.get('/users', (req, res, next) => {
    if (req.user.type !== UserType.External || req.user.role !== UserRole.External.CustomerAdmin) 
        return next(Error.ForbiddenError('Insufficient privileges'));
    return customerCtrl.getAllUsers(req, res, next); 
});
// Fetch all users under a given customer id
// To be used by Internal user
router.get('/:customerid/users', (req, res, next) => {
    if (req.user.type !== UserType.Internal) return next(Error.ForbiddenError('Insufficient privileges'));
    return customerCtrl.getAllUsersByCustomerId(req, res, next);
});

module.exports = router;
