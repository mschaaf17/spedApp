const mongoose = require('mongoose');
const Duration = require('../models/Duration');

async function cleanupDuplicateDurations() {
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

    // Group durations by student and behavior title
    const groupedDurations = {};
    
    allDurations.forEach(duration => {
      const key = `${duration.createdFor}_${duration.behaviorTitle}`;
      if (!groupedDurations[key]) {
        groupedDurations[key] = [];
      }
      groupedDurations[key].push(duration);
    });

    // Find duplicates
    const duplicates = [];
    Object.entries(groupedDurations).forEach(([key, durations]) => {
      if (durations.length > 1) {
        duplicates.push({
          key,
          durations,
          count: durations.length
        });
      }
    });

    console.log(`\nFound ${duplicates.length} groups with duplicate durations`);

    // Process duplicates
    for (const duplicate of duplicates) {
      console.log(`\nProcessing duplicates for: ${duplicate.key}`);
      console.log(`Found ${duplicate.count} duplicate entries`);
      
      // Sort by creation date (keep the oldest one)
      const sortedDurations = duplicate.durations.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Keep the first (oldest) one, deactivate the rest
      const keepDuration = sortedDurations[0];
      const removeDurations = sortedDurations.slice(1);
      
      console.log(`Keeping duration ID: ${keepDuration._id} (created: ${keepDuration.createdAt})`);
      
      // Deactivate the duplicates
      for (const removeDuration of removeDurations) {
        console.log(`Deactivating duration ID: ${removeDuration._id} (created: ${removeDuration.createdAt})`);
        await Duration.findByIdAndUpdate(removeDuration._id, { isActive: false });
      }
    }

    // Also check for any durations with the same behaviorTitle for the same student
    // regardless of templateId (in case there are issues with templateId)
    console.log('\nChecking for duplicates by behaviorTitle and student...');
    const allActiveDurations = await Duration.find({ isTemplate: false, isActive: true });
    const titleGrouped = {};
    
    allActiveDurations.forEach(duration => {
      const key = `${duration.createdFor}_${duration.behaviorTitle}`;
      if (!titleGrouped[key]) {
        titleGrouped[key] = [];
      }
      titleGrouped[key].push(duration);
    });

    const titleDuplicates = [];
    Object.entries(titleGrouped).forEach(([key, durations]) => {
      if (durations.length > 1) {
        titleDuplicates.push({
          key,
          durations,
          count: durations.length
        });
      }
    });

    console.log(`Found ${titleDuplicates.length} groups with duplicate behavior titles`);

    // Process title duplicates
    for (const duplicate of titleDuplicates) {
      console.log(`\nProcessing title duplicates for: ${duplicate.key}`);
      console.log(`Found ${duplicate.count} duplicate entries`);
      
      // Sort by creation date (keep the oldest one)
      const sortedDurations = duplicate.durations.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Keep the first (oldest) one, deactivate the rest
      const keepDuration = sortedDurations[0];
      const removeDurations = sortedDurations.slice(1);
      
      console.log(`Keeping duration ID: ${keepDuration._id} (created: ${keepDuration.createdAt})`);
      
      // Deactivate the duplicates
      for (const removeDuration of removeDurations) {
        console.log(`Deactivating duration ID: ${removeDuration._id} (created: ${removeDuration.createdAt})`);
        await Duration.findByIdAndUpdate(removeDuration._id, { isActive: false });
      }
    }

    console.log('\nCleanup completed!');
    
    // Verify cleanup
    const remainingDurations = await Duration.find({ isTemplate: false, isActive: true });
    console.log(`Remaining active durations: ${remainingDurations.length}`);
    
    console.log('\nRemaining active durations:');
    remainingDurations.forEach(d => {
      console.log(`- ID: ${d._id}, Title: ${d.behaviorTitle}, Student: ${d.createdFor}, Created: ${d.createdAt}`);
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupDuplicateDurations(); 