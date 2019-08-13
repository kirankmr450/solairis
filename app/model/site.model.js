var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var inverterSchema = new Schema({
    name: String,
    make: String,
    model: String
});

var meterSchema = new Schema({
    name: String,
    make: String,
    model: String,
    serialNumber: String,
    purchaseDate: Date,
    InstallationDate: Date,
    warrantyDetails: {
        startDate: Date,
        endDate: Date,
        number: String
    }
});

var siteSchema = new Schema({
    name: String,
    users: [{
        userId: Schema.Types.ObjectId,
        role: String
    }],
    capacityInKW: Number,
    panelCount: Number,
    battriesCount: Number,
    inverters: [inverterSchema],
    meters: [meterSchema],
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
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model('Site', siteSchema);