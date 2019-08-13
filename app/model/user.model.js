var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.userType = { Internal: 'internal-user', 
                            External: 'external-user' };
module.exports.userRole = {
    'Internal': {Root: 'Root', Admin: 'Admin', Operator: 'Operator'},
    'External': {Admin: 'CustomerAdmin', 
                 SiteAdmin: 'SiteAdmin', 
                 Engineer: 'SiteEngineer', 
                 /* No role assigned yet */
                 NotAssigned: 'NA'}
};
module.exports.userRole.Root = 'Root';

var userSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phonenumber: String,
    password: { type: String, required: true },
    isNewUser: { type: Boolean, required: true },
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

module.exports = mongoose.model('User', userSchema);