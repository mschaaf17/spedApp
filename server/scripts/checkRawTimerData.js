const mongoose = require('mongoose');
const Duration = require('../models/Duration');

async function checkRawTimerData() {
  try {
    // Connect to MongoDB using the same connection string as the server
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27018/inclusion-student-app",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Connected to MongoDB');

    // Find all active durations
    const activeDurations = await Duration.find({ isTemplate: false, isActive: true });
    console.log(`Found ${activeDurations.length} active durations`);

    activeDurations.forEach(duration => {
      console.log(`\n=== ${duration.behaviorTitle} ===`);
      console.log(`Duration ID: ${duration._id}`);
      console.log(`Student: ${duration.createdFor}`);
      console.log(`Total timers: ${duration.timers.length}`);
      
      if (duration.timers.length > 0) {
        console.log('\nRaw timer data:');
        duration.timers.forEach((timer, index) => {
          console.log(`  Timer ${index + 1}:`);
          console.log(`    ID: ${timer.timerId}`);
          console.log(`    Status: ${timer.status}`);
          console.log(`    Start Time (raw): ${timer.startTime}`);
          console.log(`    Start Time (type): ${typeof timer.startTime}`);
          console.log(`    End Time (raw): ${timer.endTime}`);
          console.log(`    End Time (type): ${typeof timer.endTime}`);
          console.log(`    Is Active: ${timer.isActive}`);
          console.log('');
        });
      } else {
        console.log('No timers found');
      }
    });

  } catch (error) {
    console.error('Error checking raw timer data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the check
checkRawTimerData(); 