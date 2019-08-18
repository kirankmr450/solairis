var jwt = require("jwt-simple");
var passport = require("passport");
var moment = require("moment");
var Strategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;
var UserModel = require("../model/user.model").userModel;
var UserCtrl = require('./user.controller');
var Error = require('../error/error');
// Use Password Generator https://www.lastpass.com/password-generator
const JWT_SECRET = 't^WyGhDxIPVngwLAoGkyjt*YM!N$6F0h';

// Page where it is explained.
// https://jonathas.com/token-based-authentication-in-nodejs-with-passport-jwt-and-bcrypt/

/**
 * Initializes the passport module for use.
 * The module uses JWT passport module for authentication.
 */
exports.initialize = () => {
    passport.use("jwt", getStrategy());
    return passport.initialize();
}

exports.authenticateMW = (req, res, next) => {
    return exports.authenticate((err, user, info) => {
            if (err) return next(err);
            if (!user) {
                if (info.name === "TokenExpiredError") {
                    return res.status(401).json({ message: "Your token has expired. Please generate a new one" });
                } else {
                    return res.status(401).json({ message: info.message });
                }
            }
//            app.set("user", user);
            req.user = user;
            return next();
        })(req, res, next);
}

/**
 * Invoked for every API call
 * to verify the authentication token
 */
exports.authenticate = (callback) => 
    passport.authenticate("jwt", { session: false, failWithError: true }, callback);


// NOT IN USE
// User creation should happen from UserController.createUser() API
// which can be invoked only by admin. 
exports.register = async (req, res, next) => {
    next(Error.MissingItemError('API not supported'));
//    try {
//        if (Object.keys(req.body).length === 0) {
//            return res.status(400).json({error: "Request body is missing"});
//        }
//        if (!req.body.firstname) {
//            return res.status(400).json({error: "Mandatory field 'firstname' missing."});
//        }
//        if (!req.body.emailid) {
//            return res.status(400).json({"error": "Mandatory field 'emailid' missing."});
//        }
//        if (!req.body.password) {
//            return res.status(400).json({"error": "Mandatory field 'password' missing."});
//        }
//        
//        let user = await userCtrl.create(req.body.firstname, 
//                                        req.body.lastname,
//                                        req.body.emailid,
//                                        req.body.password);
//        res.status(200).json(genToken(user, true));
//    } catch (err) {
//        console.log(err);
//        res.status(400).json({error: 'Invalid data'});
//    }
}

/**
 * Login API
 */
exports.login = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) 
            throw Error.UserError('Request body is missing');
        if (!req.body.email) throw Error.UserError("Mandatory field 'email' missing.");
        if (!req.body.password) throw Error.UserError("Mandatory field 'password' missing.");
        
        let user = await UserModel.findOne({ email: req.body.email }).exec();
        if (user === null) throw Error.AuthenticationError('Incorrect credentials');
        // Handle inactive user
        if (user.active === false) throw Error.ForbiddenError('Account deactivated.'); 
        let success = await user.comparePassword(req.body.password);
        if (success === false) throw Error.AuthenticationError('Incorrect credentials');
        res.status(200).json(genToken(user, user.isNewUser));
    } catch (e) {
        next(e);
    }
}


// Resets user password. Performs following check:
// a. Ensure password is passed in the body
// b. Ensure request has valid JWT token
// c. Ensure user is authorized to change password 
// (One can change only his own password).
exports.resetPassword = async (req, res, next) => {
    if (Object.keys(req.body).length === 0 || 
        !req.body.password) return next(Error.UserError('Mandatory field "password" missing.'));
    
    exports.authenticate((err, user, info) => {
        if (err || !user) return next(Error.AuthenticationError('Invalid token.'));
        if (user.id != req.params.userid) return next(Error.ForbiddenError('Unauthorized access error.'));
        return UserCtrl.updatePassword(req, res, next);     
    })(req, res, next);
}

/**
 * Generates authentication token
 * Second parameter specifies if the authentication token is temporary.
 * If a user logs-in first time, he receives a temporary authentication token.
 * Once he changes his password, he would receive a permanent authentication token for subsequent operation.
 */
var genToken = (user, tmpToken) => {
    let expires;
    if (tmpToken) expires = moment().utc().add({ minutes: 10 }).unix();
    else expires = moment().utc().add({ hours: 7 }).unix();
    
    let token = jwt.encode({
        exp: expires,
        userid: user._id
    }, JWT_SECRET);

    return {
        token: "JWT " + token,
        expires: moment.unix(expires).format(),
        isNewUser: user.isNewUser,
        role: user.role,
        userid: user._id
    };
}


/**
 * Create authentication strategy
 * In this case we are using JWT authentication.
 */
var getStrategy = () => {
    const params = {
        // Custom JWT secret created from 
        secretOrKey: JWT_SECRET, 
        // Specify how JWT token will be sent.
        // In this case, it will be in 'Authentication' Header with
        // token preceding with 'JWT'.
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
        passReqToCallback: true
    };

    // Note that the 'payload' is the payload packed in the token.
    return new Strategy(params, async (req, payload, done) => {
        try {
            var user = await UserModel.findById(payload.userid);
            if (user === null) return done(null, false, { message: "The user in the token was not found" });
            
            // If user is inactive, throw error.
            if (!user.active) return done(Error.ForbiddenError('Insufficient access'));
            
            // Returns User object in app for user to inspect.
            return done(null, { id: user._id, 
                                type: user.type,
                                role: user.role,
                                customerId: user.customerid
                              }
                       );
        } catch (err) {
            done(err);
        }
    });
        
        
//        , (err, user) => {
//            if (err) return done(err);
//            if (user === null) return done(null, false, { message: "The user in the token was not found" });
//            
//            // If user is inactive, throw error.
//            if (!user.active) return done(Error.ForbiddenError('Insufficient access'));
//
//            // Returns User object in app for user to inspect.
//            return done(null, { id: user._id, isNewUser: user.isNewUser, role: user.role });
//        });
//    });
}