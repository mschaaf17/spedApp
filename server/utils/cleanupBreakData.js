const mongoose = require('mongoose');
const User = require('../models/User');

// Cleanup script to remove invalid break records
async function cleanupBreakData() {
  try {
    console.log('Starting break data cleanup...');
    
    // Find all users with break history
    const users = await User.find({ breakHistory: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with break history to check`);
    
    let cleanedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      const validBreakHistory = [];
      
      for (const breakRecord of user.breakHistory) {
        // Skip null or undefined records
        if (!breakRecord) {
          console.log(`Removing null/undefined break record for user: ${user.username}`);
          cleanedCount++;
          continue;
        }
        
        // Check if it's a valid break record
        if (typeof breakRecord === 'object' && breakRecord.startTime) {
          const startTime = new Date(breakRecord.startTime);
          if (isNaN(startTime.getTime())) {
            console.log(`Removing break record with invalid startTime for user ${user.username}:`, breakRecord.startTime);
            cleanedCount++;
            continue;
          }
          
          // Check if duration is valid
          if (breakRecord.duration !== null && breakRecord.duration !== undefined) {
            if (isNaN(breakRecord.duration) || breakRecord.duration < 0) {
              console.log(`Fixing invalid duration for user ${user.username}:`, breakRecord.duration);
              breakRecord.duration = 0; // Set to 0 if invalid
            }
          }
          
          validBreakHistory.push(breakRecord);
        } else if (typeof breakRecord === 'string') {
          // Legacy format - convert to new format
          const timestamp = parseInt(breakRecord);
          if (isNaN(timestamp) || isNaN(new Date(timestamp).getTime())) {
            console.log(`Removing invalid timestamp string for user ${user.username}: ${breakRecord}`);
            cleanedCount++;
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
            console.log(`Removing invalid Date object for user ${user.username}`);
            cleanedCount++;
            continue;
          }
          validBreakHistory.push({
            startTime: breakRecord,
            endTime: null,
            duration: null
          });
        } else {
          // Unknown format - remove it
          console.log(`Removing unknown format break record for user ${user.username}:`, breakRecord);
          cleanedCount++;
          continue;
        }
      }
      
      if (validBreakHistory.length !== user.breakHistory.length) {
        user.breakHistory = validBreakHistory;
        await user.save();
        needsUpdate = true;
        console.log(`Cleaned break history for user: ${user.username} (${validBreakHistory.length} valid records)`);
      }
    }
    
    console.log(`Cleanup completed. Removed ${cleanedCount} invalid records.`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spedApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  cleanupBreakData().then(() => {
    console.log('Cleanup script finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  });
}

module.exports = cleanupBreakData; 