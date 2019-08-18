var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Maps user with the site.
//A user can have different privileges at different sites
//User can be created without associated it with any site.
//When a site is deleted, corresponding user is unaffected (Including site-admin)
//This does not store customer-admin info, as it is never mapped to any site.
var userSchema = new Schema({
    userid: Schema.Types.ObjectId,
    sites: [{
        siteids: Schema.Types.ObjectId,
        role: String
    }]
})

var customerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    // Primary email id can never change
    primaryemail: {
        type: String,
        required: true,
        unique: true
    },
    emails: [String],
    phonenumbers: [String],
    website: String,
    address: {
        line1: String,
        line2: String,
        locality: String,
        city: String,
        pin: String,
        state: String,
        country: String,
        location: {
            latitude: Number,
            longitude: Number
        }
    },
    active: Boolean
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

module.exports = mongoose.model('Customer', customerSchema);