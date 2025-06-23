const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/inclusion-student-app';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`\nFound ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  _id: ${user._id}`);
      console.log(`  username: ${user.username} (type: ${typeof user.username})`);
      console.log(`  isAdmin: ${user.isAdmin} (type: ${typeof user.isAdmin})`);
      console.log(`  firstName: ${user.firstName} (type: ${typeof user.firstName})`);
      console.log(`  lastName: ${user.lastName} (type: ${typeof user.lastName})`);
      console.log(`  studentSchoolId: ${user.studentSchoolId} (type: ${typeof user.studentSchoolId})`);
      
      // Check for problematic values
      if (user.username === null || user.username === undefined) {
        console.log(`  ❌ PROBLEM: username is ${user.username}`);
      }
      if (user.isAdmin === null || user.isAdmin === undefined) {
        console.log(`  ❌ PROBLEM: isAdmin is ${user.isAdmin}`);
      }
    });

    // Check for users with null values
    const usersWithNullUsername = await User.find({ username: null });
    const usersWithNullIsAdmin = await User.find({ isAdmin: null });
    
    console.log(`\nUsers with null username: ${usersWithNullUsername.length}`);
    console.log(`Users with null isAdmin: ${usersWithNullIsAdmin.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUsers(); 