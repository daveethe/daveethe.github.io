const mongoose = require('mongoose');

const VacationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    activities: [
        {
            type: String,
            description: String,
        },
    ],
});

module.exports = mongoose.model('Vacation', VacationSchema);
