const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    serialNumber: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    registrationDate: { type: Date, default: Date.now },
    billPdfPath: { type: String, required: true }  // Add this line
});

const Warranty = mongoose.model('Warranty', warrantySchema);

module.exports = Warranty;
