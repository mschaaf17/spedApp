const mongoose = require('mongoose');
const { Frequency, Duration } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spedApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixCreatedAtDates() {
  try {
    console.log('Checking for incorrect createdAt dates...');
    
    // Check frequencies
    const frequencies = await Frequency.find({ isTemplate: false });
    console.log(`Found ${frequencies.length} student-assigned frequencies`);
    
    let fixedFrequencies = 0;
    for (const freq of frequencies) {
      const createdAt = new Date(freq.createdAt);
      if (isNaN(createdAt.getTime()) || createdAt > new Date()) {
        console.log(`Fixing frequency ${freq._id}: ${freq.behaviorTitle}`);
        console.log(`  Old createdAt: ${freq.createdAt}`);
        freq.createdAt = new Date();
        await freq.save();
        fixedFrequencies++;
        console.log(`  New createdAt: ${freq.createdAt}`);
      }
    }
    
    // Check durations
    const durations = await Duration.find({ isTemplate: false });
    console.log(`Found ${durations.length} student-assigned durations`);
    
    let fixedDurations = 0;
    for (const dur of durations) {
      const createdAt = new Date(dur.createdAt);
      if (isNaN(createdAt.getTime()) || createdAt > new Date()) {
        console.log(`Fixing duration ${dur._id}: ${dur.behaviorTitle}`);
        console.log(`  Old createdAt: ${dur.createdAt}`);
        dur.createdAt = new Date();
        await dur.save();
        fixedDurations++;
        console.log(`  New createdAt: ${dur.createdAt}`);
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`- Fixed ${fixedFrequencies} frequencies`);
    console.log(`- Fixed ${fixedDurations} durations`);
    
  } catch (error) {
    console.error('Error fixing createdAt dates:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixCreatedAtDates(); 