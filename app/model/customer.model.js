var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customerSchema = new Schema({
    name: String,
    email: String,
    phonenumber: [String],
    active: Boolean,
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
    users: [Schema.Types.ObjectId],
    sites: [Schema.Types.ObjectId]
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model('Customer', customerSchema);