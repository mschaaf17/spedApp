const mongoose = require('mongoose');

// Direct database fix for invalid break records
async function fixBreaksDirect() {
  try {
    console.log('Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/inclusion-student-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database');
    
    // Get the database and collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find all users with break history
    const users = await usersCollection.find({
      breakHistory: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`Found ${users.length} users with break history`);
    
    let totalFixed = 0;
    
    for (const user of users) {
      console.log(`Processing user: ${user.username || user._id}`);
      
      if (!user.breakHistory || !Array.isArray(user.breakHistory)) {
        console.log('  No break history or not an array, skipping');
        continue;
      }
      
      const originalLength = user.breakHistory.length;
      const validBreakHistory = [];
      
      for (const breakRecord of user.breakHistory) {
        // Skip null or undefined records
        if (!breakRecord) {
          console.log('  Removing null/undefined record');
          continue;
        }
        
        // Check if it's a valid break record with startTime
        if (typeof breakRecord === 'object' && breakRecord.startTime) {
          const startTime = new Date(breakRecord.startTime);
          if (isNaN(startTime.getTime())) {
            console.log('  Removing record with invalid startTime:', breakRecord.startTime);
            continue;
          }
          
          // Check if duration is valid
          if (breakRecord.duration !== null && breakRecord.duration !== undefined) {
            if (isNaN(breakRecord.duration) || breakRecord.duration < 0) {
              console.log('  Fixing invalid duration:', breakRecord.duration);
              breakRecord.duration = 0;
            }
          }
          
          validBreakHistory.push(breakRecord);
        } else if (typeof breakRecord === 'string') {
          // Legacy format - convert to new format
          const timestamp = parseInt(breakRecord);
          if (isNaN(timestamp) || isNaN(new Date(timestamp).getTime())) {
            console.log('  Removing invalid timestamp string:', breakRecord);
            continue;
          }
          validBreakHistory.push({
            startTime: new Date(timestamp),
            endTime: null,
            duration: null
          });
        } else if (breakRecord instanceof Date) {
          // Legacy format - convert to new format
          if (isNaN(breakRecord.getTime())) {
            console.log('  Removing invalid Date object');
            continue;
          }
          validBreakHistory.push({
            startTime: breakRecord,
            endTime: null,
            duration: null
          });
        } else if (typeof breakRecord === 'object' && breakRecord._id && !breakRecord.startTime) {
          // Invalid record with only _id - remove it
          console.log('  Removing invalid record with only _id:', breakRecord._id);
          totalFixed++;
          continue;
        } else {
          // Unknown format - remove it
          console.log('  Removing unknown format record:', breakRecord);
          totalFixed++;
          continue;
        }
      }
      
      if (validBreakHistory.length !== originalLength) {
        console.log(`  Fixed break history: ${originalLength} -> ${validBreakHistory.length} records`);
        
        // Update the user document
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { breakHistory: validBreakHistory } }
        );
        
        totalFixed += (originalLength - validBreakHistory.length);
      } else {
        console.log('  No changes needed');
      }
    }
    
    console.log(`\nFix completed. Total records removed: ${totalFixed}`);
    
  } catch (error) {
    console.error('Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the fix
fixBreaksDirect().then(() => {
  console.log('Script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
}); 