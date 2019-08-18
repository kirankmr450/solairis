var mongoose = require('mongoose');
var UserModel = require('../model/user.model').userModel;
var UserType = require('../model/user.model').userType;
var UserRole = require('../model/user.model').userRole;
var Error = require('../error/error');

// Creates a new user
exports.createInternalUser = async (req, res, next) => {
    try {
        var user = doCreateUser(req, UserType.Internal);
        return res.status(201).send({
            _id: user._id,
            name: user.name,
            email: user.email,
            phonenumber: user.phonenumber
        });
    } catch (e) {
        // Email id is unique in the table. 
        // Handle duplicate email error message.
        if (e.code === 11000) return next(Error.ConflictError('Duplicate email id.'));
        // Handle scenario when certain parameter type is incorrect.
        if (e.name == 'CastError') return next(Error.UserError('Invalid argument'));
        return next(e);
    }
}

exports.createExternalUser = async(req) => {
    return doCreateUser(req, UserType.External);
}

// Creates a new user after input verification
var doCreateUser = async (req, type) => {
    if (Object.keys(req.body).length === 0) throw Error.UserError('Request body is missing');
    if (!req.body.name) throw Error.UserError('Mandatory field "name" missing.');
    if (!req.body.email) throw Error.UserError('Mandatory field "email" missing.');
    if (!req.body.password) throw Error.UserError('Mandatory field "password" missing.');
    if (Object.keys(UserType).indexOf(type) === -1) 
        throw Error.UserError('Invalid user type');
    if (type === UserType.Internal) {
        if (!req.body.role || 
            Object.keys(UserRole[type]).indexOf(req.body.role) === -1) 
            throw Error.UserError('Invalid user role');
    }
//    else if (type === UserType.External) {
//        if (!req.body.role ||
//            req.body.role === UserRole.External.CustomerAdmin ||
//            Object.keys(UserRole[type]).indexOf(req.body.role) === -1)
//            throw Error.UserError('Invalid user role');
//    }

    var userObj = {
        name: req.body.name,
        type: type,
        email: req.body.email,
        phonenumber: req.body.phonenumber,
        password: req.body.password,
        isnewuser: true,
        active: true
    };
    // NO need to specify role for Root and External User.
    if (req.body.type === UserType.Internal) userObj.role = req.body.role;
    else if(req.body.type === UserType.External) userObj.customerid = req.user.customerId;
    var user = await new UserModel(userObj).save();
    if (!user || user.length === 0) throw Error.ServerError('Error creating user.');
    return user;
}


// Create customer admin
// This is created when a new customer is created.
// No need to check permission for this API, as it is only called internally.
exports.createCustomerAdmin = async (customerid, name, email, phonenumber, password) => {
    var user = await new UserModel({
        name, email, phonenumber, customerid, password,
        type: UserType.External,
        role: UserRole.External.CustomerAdmin,
        isnewuser: true,
        active: true
    }).save();
    if (!user || user.length === 0) throw Error.ServerError('Error creating user.');
    return user._id;
}


// User can only change his own password.
// This check should be done by the caller.
exports.updatePassword = async (req, res, next) => {
    try {
        var user = await UserModel.findById(req.params.userid).exec();
        if (!user) throw Error.MissingItemError('User not found');
        user.password = req.body.password;
        user.isnewuser = false;
        user = await user.save();
        res.status(200).json({message: 'Password changed successfully'});
    } catch (e) {
        next(e);
    }
}

// Only admin can perform this operation.
exports.activateDeactivateUser = async (req, res, next, activationStatus) => {
    try {
        var user = await UserModel.findByIdAndUpdate(req.params.userid, {active: activationStatus}).exec();
        if (!user) throw Error.MissingItemError('User not found');
        res.status(200).json({message: 'User activated successfully.'});
    } catch (e) {
        next(e);
    }
}

// Activate SiteAdmin of a given Customer
exports.activateCustomer = async (customerId) => {
    // Activates the SiteAdmin
    var users = await UserModel.findOneAndUpdate(
        {customerid: customerId, role: UserRole.External.CustomerAdmin}, 
        {active: true}).exec();
    if (!users || users.length === 0) throw Error.MissingItemError('User not found');
}

// Deactivate customer - Deactivate all associated user.
exports.deactivateCustomer = async (customerId) => {
    // Deactivates all users of this customer.
    var users = await UserModel.findOneAndUpdate({customerid: customerId}, {active: false}).exec();
}

// Updates a user
exports.updateUser = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) throw Error.UserError('Request body is missing');
        if (req.body.name !== undefined && !req.body.name) 
            throw Error.UserError('Mandatory field "name" missing.');
        var user = await UserModel.findById(req.params.userid).exec();
        if (!user) throw Error.MissingItemError('User not found');

        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.phonenumber !== undefined) user.phonenumber = req.body.phonenumber;
        
        user = await user.save();
        return res.status(200).send({
            _id: user._id,
            name: user.name,
            email: user.email,
            phonenumber: user.phonenumber
        });
    } catch(e) {
        // Handle scenario when certain parameter type is incorrect.
        if (e.name == 'CastError') return next(Error.UserError('Invalid argument'));
        return next(e);
    }
}

// Get User by user id
exports.getUser = async(req, res, next) => {
    try {
        var user = await UserModel.findOne(
            {_id: req.params.userid, type: UserModel.userType.Internal}, 
            {name, email, phonenumber, active}).lean().exec();
        if (!user) throw Error.MissingItem('User does not exist.');
        return res.status(200).send(user);
    } catch (e) {
        if (e.name == 'CastError') return next(Error.UserError('Invalid argument'));
        next(e);
    } 
}

exports.getUserById = async(userid) => {
    return await UserModel.findById(userid);
}

// Can be invoked by internal root/admin user
exports.getAllInternalUser = async (req, res, next) => {
    try {
        var users = await UserModel.find(
            {role: {$ne: UserRole.Internal.Root}}, 
            {password: 0}).lean().exec();
        if (!users) throw Error.ServerError('Something went wrong.');
        return res.status(200).send(users);
    } catch (e) {
        if (e.name == 'CastError') return next(Error.UserError('Invalid argument'));
        next(e);
    }
}