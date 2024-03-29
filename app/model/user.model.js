var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

module.exports.userType = { Root: 'Root', 
                            Internal: 'Internal', 
                            External: 'External' };
module.exports.userRole = {
    'Internal': {Admin: 'Admin', Operator: 'Operator'},
    'External': {CustomerAdmin: 'CustomerAdmin', 
                 SiteAdmin: 'SiteAdmin', 
                 SiteEngineer: 'SiteEngineer', 
                 /* No role assigned yet */
                 NotAssigned: 'NotAssigned'}
};
module.exports.userRole.Root = 'Root';

var userSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    // Role is optional and needed for only Internal Type
    // For External user role is specified in the Site/Customer
    role: { type: String },
    customerid: Schema.Types.ObjectId,
    email: { type: String, required: true, unique: true },
    phonenumber: String,
    password: { type: String, required: true },
    isnewuser: { type: Boolean, required: true },
    active: { type: Boolean, required: true }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });


userSchema.pre("save", function (next) {
    var that = this;
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(that.password, salt, (err, hash) => {
            that.password = hash;
            next();
        });
    });
});

userSchema.pre("update", function (next) {
    var that = this;
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(that.password, salt, (err, hash) => {
            that.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword) {
    let password = this.password;
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, password, (err, success) => {
            if (err) return reject(err);
            return resolve(success);
        });
    });
};

module.exports.userModel = mongoose.model('User', userSchema);