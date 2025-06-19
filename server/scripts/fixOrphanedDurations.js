const mongoose = require('mongoose');
const Duration = require('../models/Duration');

async function fixOrphanedDurations() {
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

    // Find all durations that are not templates
    const allDurations = await Duration.find({ isTemplate: false });
    console.log(`Found ${allDurations.length} non-template durations`);

    // Show all durations for debugging
    console.log('\nAll durations:');
    allDurations.forEach(d => {
      console.log(`- ID: ${d._id}, Title: ${d.behaviorTitle}, Student: ${d.createdFor}, Active: ${d.isActive}, Created: ${d.createdAt}`);
    });

    // Find orphaned durations (those with undefined or null createdFor)
    const orphanedDurations = allDurations.filter(d => !d.createdFor);
    console.log(`\nFound ${orphanedDurations.length} orphaned durations`);

    if (orphanedDurations.length > 0) {
      console.log('\nOrphaned durations:');
      orphanedDurations.forEach(d => {
        console.log(`- ID: ${d._id}, Title: ${d.behaviorTitle}, Student: ${d.createdFor}, Active: ${d.isActive}, Created: ${d.createdAt}`);
      });

      // Deactivate orphaned durations
      console.log('\nDeactivating orphaned durations...');
      for (const orphaned of orphanedDurations) {
        console.log(`Deactivating duration ID: ${orphaned._id} (Title: ${orphaned.behaviorTitle})`);
        await Duration.findByIdAndUpdate(orphaned._id, { isActive: false });
      }
    }

    console.log('\nFix completed!');
    
    // Verify fix
    const remainingDurations = await Duration.find({ isTemplate: false, isActive: true });
    console.log(`Remaining active durations: ${remainingDurations.length}`);
    
    console.log('\nRemaining active durations:');
    remainingDurations.forEach(d => {
      console.log(`- ID: ${d._id}, Title: ${d.behaviorTitle}, Student: ${d.createdFor}, Created: ${d.createdAt}`);
    });

  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixOrphanedDurations(); 