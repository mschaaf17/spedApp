const mongoose = require('mongoose')

// mongoose port name
mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27018/inclusion-student-app',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
)

module.exports = mongoose.connection