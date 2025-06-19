const mongoose = require('mongoose');
const Duration = require('../models/Duration');

async function checkTimerData() {
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
        console.log('\nTimer details:');
        duration.timers.forEach((timer, index) => {
          console.log(`  Timer ${index + 1}:`);
          console.log(`    ID: ${timer.timerId}`);
          console.log(`    Status: ${timer.status}`);
          console.log(`    Start Time: ${timer.startTime ? new Date(parseInt(timer.startTime)).toLocaleString() : 'null'}`);
          console.log(`    End Time: ${timer.endTime ? new Date(parseInt(timer.endTime)).toLocaleString() : 'null'}`);
          console.log(`    Is Active: ${timer.isActive}`);
          
          if (timer.startTime && timer.endTime) {
            const durationMs = parseInt(timer.endTime) - parseInt(timer.startTime);
            const durationMinutes = Math.round(durationMs / (1000 * 60));
            console.log(`    Duration: ${durationMinutes} minutes`);
          }
          console.log('');
        });
      } else {
        console.log('No timers found');
      }
    });

  } catch (error) {
    console.error('Error checking timer data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the check
checkTimerData(); 