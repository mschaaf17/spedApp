const mongoose = require('mongoose');
const Duration = require('../models/Duration');

async function fixTimerTimestamps() {
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

    for (const duration of activeDurations) {
      console.log(`\nProcessing ${duration.behaviorTitle}...`);
      let hasChanges = false;

      duration.timers.forEach((timer, index) => {
        // Check if startTime is a string that needs conversion
        if (timer.startTime && typeof timer.startTime === 'string') {
          console.log(`  Fixing timer ${index + 1} startTime: ${timer.startTime}`);
          timer.startTime = new Date(parseInt(timer.startTime));
          hasChanges = true;
        }

        // Check if endTime is a string that needs conversion
        if (timer.endTime && typeof timer.endTime === 'string') {
          console.log(`  Fixing timer ${index + 1} endTime: ${timer.endTime}`);
          timer.endTime = new Date(parseInt(timer.endTime));
          hasChanges = true;
        }
      });

      if (hasChanges) {
        await duration.save();
        console.log(`  Saved changes for ${duration.behaviorTitle}`);
      } else {
        console.log(`  No changes needed for ${duration.behaviorTitle}`);
      }
    }

    console.log('\nTimestamp fix completed!');

  } catch (error) {
    console.error('Error fixing timer timestamps:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixTimerTimestamps(); 