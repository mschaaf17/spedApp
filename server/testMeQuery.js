const mongoose = require('mongoose');
const User = require('./models/User');
const AccommodationList = require('./models/AccommodationList');
const Frequency = require('./models/Frequency');
const Duration = require('./models/Duration');
const InterventionList = require('./models/InterventionList');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/inclusion-student-app';

async function testMeQuery() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test with student1 (the one that's causing issues)
    const studentId = '6854484f2bec6614676f3079'; // student1's ID
    
    console.log('\nTesting the exact same query as the me resolver...');
    
    const userData = await User.findOne({ _id: studentId })
      .select("-__v -password")
      .populate("students")
      .populate("accommodations")
      .populate("behaviorFrequencies")
      .populate("behaviorDurations")
      .populate("interventions");

    console.log('\nRaw user data:');
    console.log(JSON.stringify(userData, null, 2));

    // Check each field for null values
    console.log('\nChecking for null values:');
    console.log(`username: ${userData.username} (type: ${typeof userData.username})`);
    console.log(`isAdmin: ${userData.isAdmin} (type: ${typeof userData.isAdmin})`);
    console.log(`firstName: ${userData.firstName} (type: ${typeof userData.firstName})`);
    console.log(`lastName: ${userData.lastName} (type: ${typeof userData.lastName})`);

    // Check populated fields
    console.log('\nChecking populated fields:');
    console.log(`students: ${userData.students?.length || 0} items`);
    console.log(`accommodations: ${userData.accommodations?.length || 0} items`);
    console.log(`behaviorFrequencies: ${userData.behaviorFrequencies?.length || 0} items`);
    console.log(`behaviorDurations: ${userData.behaviorDurations?.length || 0} items`);
    console.log(`interventions: ${userData.interventions?.length || 0} items`);

    // Check if any populated items have null values
    if (userData.accommodations) {
      userData.accommodations.forEach((acc, index) => {
        if (acc && (acc.username === null || acc.isAdmin === null)) {
          console.log(`❌ PROBLEM: accommodation ${index} has null values:`, acc);
        }
      });
    }

    if (userData.behaviorFrequencies) {
      userData.behaviorFrequencies.forEach((freq, index) => {
        if (freq && (freq.username === null || freq.isAdmin === null)) {
          console.log(`❌ PROBLEM: behaviorFrequency ${index} has null values:`, freq);
        }
      });
    }

    if (userData.behaviorDurations) {
      userData.behaviorDurations.forEach((dur, index) => {
        if (dur && (dur.username === null || dur.isAdmin === null)) {
          console.log(`❌ PROBLEM: behaviorDuration ${index} has null values:`, dur);
        }
      });
    }

    if (userData.interventions) {
      userData.interventions.forEach((int, index) => {
        if (int && (int.username === null || int.isAdmin === null)) {
          console.log(`❌ PROBLEM: intervention ${index} has null values:`, int);
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testMeQuery(); 