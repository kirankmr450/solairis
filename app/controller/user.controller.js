var mongoose = require('mongoose');
var UserModel = require('../model/user.model')
var Utils = require('../utils/utils');
var Error = require('../error/error');


exports.createUser = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) throw Error.UserError('Request body is missing');
        if (!req.body.name) throw Error.UserError('Mandatory field "name" missing.');
        if (!req.body.type) throw Error.UserError('Mandatory field "type" missing.');
        if (!req.body.email) throw Error.UserError('Mandatory field "email" missing.');
        if (!req.body.password) throw Error.UserError('Mandatory field "password" missing.');
//        checkForInvalidUserTypeAndRole(req.body.type, req.body.role);
        
        var user = await new UserModel({
            name: req.body.name,
            type: req.body.type,
            email: req.body.email,
            phonenumber: req.body.phonenumber,
            password: req.body.password,
            isNewUser: true,
            active: true
        }).save();
        if (!user || user.length === 0) 
            throw Error.ServerError('Error creating user.');
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


// Returns true: if passed role is NOT compatible with type
var checkForInvalidUserTypeAndRole = (type, role) => {
    if (!type || UserModel.userType.keys.indexOf(type) === -1) 
        throw Error.UserError('Invalid user type'); 
    if (!role || UserModel.userRole[type].indexOf(role) === -1) 
        throw Error.UserError('Invalid user role');
}

// User can only change his own password.
// This check should be done by the caller.
exports.updatePassword = async (req, res, next) => {
    try {
        var user = await UserModel.findById(req.params.userid).exec();
        if (!user) throw Error.MissingItemError('User not found');
        user.password = req.body.password;
        user.isNewUser = false;
        user = await user.save();
        res.status(200).json({message: 'Password changed successfully'});
    } catch (e) {
        next(e);
    }
}

// Only admin can perform this operation.
exports.activateUser = async (req, res, next) => {
    try {
        var user = await UserModel.findByIdAndUpdate(req.params.userid, {active: true}).exec();
        if (!user) throw Error.MissingItemError('User not found');
        res.status(200).json({message: 'User activated successfully.'});
    } catch (e) {
        next(e);
    }
}

// Only admin can perform this operation.
exports.deactivateUser = async (req, res, next) => {
    try {
        var user = await UserModel.findByIdAndUpdate(req.params.userid, {active: false}).exec();
        if (!user) throw Error.MissingItemError('User not found');
        res.status(200).json({message: 'User deactivated successfully.'});
    } catch (e) {
        next(e);
    }
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

// Only admin can invoke list all user
// Anyone else can invoke this API to fetch details about themselves by providing userid.
exports.listUser = async (req, res, next) => {
    try {
        var users = await UserModel.find(
            {role: {$ne: MetaModel.userRoles.Root}}, 
            {password: 0}).lean().exec();
            if (!users) throw Error.ServerError('Something went wrong.');
            return res.status(200).send(users);
        }
    } catch (e) {
        if (e.name == 'CastError') return next(Error.UserError('Invalid argument'));
        next(e);
    }
}