const mongoose = require('mongoose');
const { Frequency, Duration, User } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spedApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function inspectDataMeasures() {
  try {
    console.log('=== INSPECTING DATA MEASURES ===\n');
    
    // Check all frequencies
    const allFrequencies = await Frequency.find({});
    console.log(`Total frequencies: ${allFrequencies.length}`);
    
    const templateFrequencies = allFrequencies.filter(f => f.isTemplate);
    const studentFrequencies = allFrequencies.filter(f => !f.isTemplate);
    
    console.log(`Template frequencies: ${templateFrequencies.length}`);
    console.log(`Student-assigned frequencies: ${studentFrequencies.length}`);
    
    if (studentFrequencies.length > 0) {
      console.log('\nStudent-assigned frequencies:');
      studentFrequencies.forEach(freq => {
        console.log(`  - ${freq.behaviorTitle} (ID: ${freq._id})`);
        console.log(`    Student ID: ${freq.studentId}`);
        console.log(`    Template ID: ${freq.templateId}`);
        console.log(`    Created At: ${freq.createdAt}`);
        console.log(`    Is Active: ${freq.isActive}`);
        console.log('');
      });
    }
    
    // Check all durations
    const allDurations = await Duration.find({});
    console.log(`Total durations: ${allDurations.length}`);
    
    const templateDurations = allDurations.filter(d => d.isTemplate);
    const studentDurations = allDurations.filter(d => !d.isTemplate);
    
    console.log(`Template durations: ${templateDurations.length}`);
    console.log(`Student-assigned durations: ${studentDurations.length}`);
    
    if (studentDurations.length > 0) {
      console.log('\nStudent-assigned durations:');
      studentDurations.forEach(dur => {
        console.log(`  - ${dur.behaviorTitle} (ID: ${dur._id})`);
        console.log(`    Created For: ${dur.createdFor}`);
        console.log(`    Template ID: ${dur.templateId}`);
        console.log(`    Created At: ${dur.createdAt}`);
        console.log(`    Is Active: ${dur.isActive}`);
        console.log('');
      });
    }
    
    // Check users with data measures
    const usersWithFrequencies = await User.find({ behaviorFrequencies: { $exists: true, $ne: [] } });
    const usersWithDurations = await User.find({ behaviorDurations: { $exists: true, $ne: [] } });
    
    console.log(`Users with behaviorFrequencies: ${usersWithFrequencies.length}`);
    console.log(`Users with behaviorDurations: ${usersWithDurations.length}`);
    
    if (usersWithFrequencies.length > 0) {
      console.log('\nUsers with behaviorFrequencies:');
      usersWithFrequencies.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (ID: ${user._id})`);
        console.log(`    behaviorFrequencies: ${user.behaviorFrequencies.length} items`);
        console.log(`    behaviorDurations: ${user.behaviorDurations.length} items`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error inspecting data measures:', error);
  } finally {
    mongoose.connection.close();
  }
}

inspectDataMeasures(); 