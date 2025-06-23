const mongoose = require('mongoose');
const User = require('../models/User');

// Migration script to convert old break data format to new format
async function migrateBreakData() {
  try {
    console.log('Starting break data migration...');
    
    // Find all users with break history
    const users = await User.find({ breakHistory: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with break history to migrate`);
    
    let migratedCount = 0;
    let cleanedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      const newBreakHistory = [];
      
      for (const breakRecord of user.breakHistory) {
        // Skip null or undefined records
        if (!breakRecord) {
          console.log(`Skipping null/undefined break record for user: ${user.username}`);
          continue;
        }
        
        if (typeof breakRecord === 'string') {
          // Old format - timestamp string, convert to new format
          const timestamp = parseInt(breakRecord);
          if (isNaN(timestamp)) {
            console.log(`Invalid timestamp string for user ${user.username}: ${breakRecord}`);
            continue;
          }
          const startTime = new Date(timestamp);
          if (isNaN(startTime.getTime())) {
            console.log(`Invalid date from timestamp for user ${user.username}: ${breakRecord}`);
            continue;
          }
          newBreakHistory.push({
            startTime: startTime,
            endTime: null,
            duration: null
          });
          needsUpdate = true;
        } else if (breakRecord instanceof Date) {
          // Old format - Date object, convert to new format
          newBreakHistory.push({
            startTime: breakRecord,
            endTime: null,
            duration: null
          });
          needsUpdate = true;
        } else if (typeof breakRecord === 'object') {
          // Check if it's already in new format
          if (breakRecord.startTime) {
            // Already has startTime, validate it
            const startTime = new Date(breakRecord.startTime);
            if (isNaN(startTime.getTime())) {
              console.log(`Invalid startTime in break record for user ${user.username}: ${breakRecord.startTime}`);
              continue;
            }
            newBreakHistory.push({
              startTime: startTime,
              endTime: breakRecord.endTime ? new Date(breakRecord.endTime) : null,
              duration: breakRecord.duration || null
            });
            needsUpdate = true;
          } else {
            // Object without startTime - skip it
            console.log(`Skipping break record without startTime for user ${user.username}:`, breakRecord);
            cleanedCount++;
            continue;
          }
        } else {
          // Unknown format - skip it
          console.log(`Unknown break record format for user ${user.username}:`, breakRecord);
          cleanedCount++;
          continue;
        }
      }
      
      if (needsUpdate) {
        user.breakHistory = newBreakHistory;
        await user.save();
        migratedCount++;
        console.log(`Migrated break data for user: ${user.username} (${newBreakHistory.length} records)`);
      }
    }
    
    console.log(`Migration completed. Updated ${migratedCount} users, cleaned ${cleanedCount} invalid records.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spedApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  migrateBreakData().then(() => {
    console.log('Migration script finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = migrateBreakData; 