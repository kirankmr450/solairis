var mongoose = require('mongoose');
var CustomerModel = require('../model/customer.model');
var UserCtrl = require('../controller/user.controller');
var UserType = require('../model/user.model').userType;
var UserRole = require('../model/user.model').userRole;
var Error = require('../error/error');

// Creates a new customer
// Creating a new customer also creates a new CustomerAdmin user 
// with the provided customer email id.
exports.createCustomer = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) throw Error.UserError('Request body is missing');
        if (!req.body.name) throw Error.UserError('Mandatory field "name" missing.');
        if (!req.body.email) throw Error.UserError('Mandatory field "email" missing.');
        if (!req.body.password) throw Error.UserError('Mandatory field "password" missing.');
        
        var phoneNumbers = [];
        if (req.body.phonenumber1) phoneNumbers.push(req.body.phonenumber1);
        if (req.body.phonenumber2) phoneNumbers.push(req.body.phonenumber2);
        
        var customer = await new CustomerModel({
            name: req.body.name,
            primaryemail: req.body.email,
            phonenumbers: phoneNumbers,
            website: req.body.website,
            address: req.body.address,
            active: true
        }).save();
        if (!customer || customer.length === 0) throw Error.ServerError('Error creating user.');
        var adminUserId = await UserCtrl.createCustomerAdmin(
            customer._id, req.body.name, req.body.email, phoneNumbers[0], req.body.password);
        
        return res.status(201).send({
            _id: customer._id,
            name: customer.name,
            primaryEmail: customer.primaryemail,
            phoneNumber: customer.phonenumbers,
            website: customer.website,
            address: customer.address,
            adminUserId
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


// Only admin can perform this operation.
exports.activateCustomer = async (req, res, next) => {
    try {
        // Activate customer entry
        var customer = await CustomerModel.findByIdAndUpdate(
            req.params.customerid, {active: true}).exec();
        if (!customer) throw Error.MissingItemError('Customer not found');
        // Activate respective customer-admin
        UserCtrl.activateCustomer(req.params.customerid);
        res.status(200).json({message: 'Customer activated successfully.'});
    } catch (e) {
        next(e);
    }
}

// Only admin can perform this operation.
exports.deactivateCustomer = async (req, res, next) => {
    try {
        var customer = await CustomerModel.findByIdAndUpdate(
            req.params.customerid, {active: false}).exec();
        if (!customer) throw Error.MissingItemError('Customer not found');
        // Also de-activates all user account associated with the customer
        UserCtrl.deactivateCustomer(req.params.customerid);
        res.status(200).json({message: 'Customer deactivated successfully.'});
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

exports.getCustomerById = async(customerid) => {
    var customer = await CustomerModel.findById(customerid);
    if (!customer) throw Error.MissingItemError('Customer does not exist');
    return customer;
}

// Get customer details by id
exports.getCustomer = async (req, res, next) => {
    try {
        var customer = await exports.getCustomerById(req.params.customerid);
        var response = {
            id: customer._id,
            name: customer.name,
            primaryEmail: customer.primaryemail,
            phonenumbers: customer.phonenumbers
        };
        // Internal user
        if (req.user.type !== UserType.External) {
            response.emails = customer.emails;
            response.website = customer.website;
            response.address = customer.address;
            response.active = customer.active;
            response.users = customer.users;
            response.sites = customer.sites;
        } else if (req.user.role === UserRole.External.CustomerAdmin) {
            // Customer Admin
            response.emails = customer.emails;
            response.website = customer.website;
            response.address = customer.address;
            response.users = customer.users;
            response.sites = customer.sites;
        } else {
            var users = customer.users.filter(u => u.userid === req.user.id);
            response.sites = (users.length === 0) ? [] : users[0].sites;
        }
        return res.status(200).send(response);
    } catch (e) {
        if (e.name == 'CastError') return next(Error.UserError('Invalid argument'));
        next (e);
    }
}

// Create user under the current customer
exports.createUser = async(req, res, next) => {
    try {
        var customer = await CustomerModel.findById(req.user.customerId);
        if (!customer) throw Error.MissingItemError('Customer does not exist');
        
        var user = UserCtrl.createExternalUser(req);
        customer.users.push({userid: user._id, sites: []});
        customer = await customer.save();
        if (!customer) throw Error.MissingItemError('Customer does not exist');
        
        return res.status(201).send({
            _id: user._id,
            name: user.name,
            email: user.email,
            phonenumber: user.phonenumber
        });
    } catch (e) {
        next(e);
    }
}

exports.getAllUsers = async (req, res, next) => {
    try {
        var customer = await CustomerModel.findById(req.user.customerId);
        if (!customer) throw Error.MissingItemError('Customer does not exist');
        var users = customer.users.map(user => userCtrl.getUserById(user.userid));
        return res.status(200).send(users);
    } catch (e) {
        next(e);
    }
}

exports.getAllUsersByCustomerId = async (req, res, next) => {
    try {
        var customer = await CustomerModel.findById(req.params.customerId);
        if (!customer) throw Error.MissingItemError('Customer does not exist');
        var users = customer.users.map(user => userCtrl.getUserById(user.userid));
        return res.status(200).send(users);
    } catch (e) {
        next(e);
    }
}