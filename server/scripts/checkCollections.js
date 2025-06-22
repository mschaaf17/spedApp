const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spedApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkCollections() {
  try {
    // Wait for connection to be established
    await mongoose.connection.asPromise();
    
    console.log('=== CHECKING DATABASE COLLECTIONS ===\n');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    console.log('\n=== CHECKING COLLECTION CONTENTS ===\n');
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
      
      if (count > 0 && count <= 5) {
        const sample = await db.collection(collection.name).find({}).limit(1).toArray();
        console.log(`  Sample document:`, JSON.stringify(sample[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error checking collections:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCollections(); 