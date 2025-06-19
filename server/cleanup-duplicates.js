const mongoose = require('mongoose');
const Duration = require('./models/Duration');

mongoose.connect('mongodb://localhost:27017/spedApp', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find duplicate durations (same student and template)
    const duplicates = await Duration.aggregate([
      { $match: { isTemplate: false } },
      { 
        $group: { 
          _id: { createdFor: '$createdFor', templateId: '$templateId' }, 
          count: { $sum: 1 }, 
          docs: { $push: '$_id' } 
        } 
      },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    console.log('Duplicate durations found:', duplicates.length);
    
    if (duplicates.length > 0) {
      for (const dup of duplicates) {
        console.log('Group:', dup._id, 'Count:', dup.count, 'IDs:', dup.docs);
        
        // Keep the first one active, deactivate the rest
        const [keep, ...remove] = dup.docs;
        await Duration.updateMany(
          { _id: { $in: remove } }, 
          { isActive: false }
        );
        console.log('Deactivated duplicates for group:', dup._id);
      }
    }
    
    console.log('Cleanup complete');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
}); 