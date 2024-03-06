const mongoose = require('mongoose');
const userSeeds = require('./userSeed.json');
const accommodationCardSeeds = require('./accommodationCardsSeed.json');
const studentAccommodationsSeed = require('./studentAccommodationsSeed.json')
const db = require('../config/connection');
const { AccommodationCards, User } = require('../models/index');

async function resetData() {
  try {
    await User.deleteMany({});
    await AccommodationCards.deleteMany({});
    await seedData();
    console.log('Data reset successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting data:', err);
    process.exit(1);
  }
}

async function seedData() {
  try {
    // Seed accommodations first
    const accommodations = await seedAccommodations();

    // Seed users
    await seedUsers(accommodations);

    // Seed student accommodations
    await seedStudentAccommodations(accommodations);

    console.log('Data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}



async function seedAccommodations() {
  try {
    console.log('Seeding accommodations...');
    const accommodationCards = await AccommodationCards.create(accommodationCardSeeds.map(seed => ({
      ...seed,
      _id: mongoose.Types.ObjectId(), // Generate new ObjectId for each accommodation
    })));
    console.log('Accommodations seeded successfully:', accommodationCards);
    return accommodationCards;
  } catch (err) {
    console.error('Error seeding accommodations:', err);
    throw err;
  }
}

async function seedUsers() {
  try {
    console.log('Seeding users...');
    // Iterate through each seed data in userSeeds array
    for (const seed of userSeeds) {
      // Create user using the seed data
      await User.create(seed);
    }
    console.log('Users seeded successfully!');
  } catch (err) {
    console.error('Error seeding users:', err);
    throw err;
  }
}

async function seedStudentAccommodations(accommodations) {
  try {
    // Iterate through student accommodations seed data
    for (const studentAccommodation of studentAccommodationsSeed) {
      // Find accommodations for the student
      const studentAccommodations = studentAccommodation.accommodations.map(title => {
        const accommodation = accommodations.find(acc => acc.title === title);
        if (!accommodation) {
          throw new Error(`Accommodation "${title}" not found.`);
        }
        return accommodation._id;
      });

      // Create student accommodation object
      const studentAccommodationData = {
        studentId: studentAccommodation.studentId,
        accommodations: studentAccommodations,
      };

      // Save student accommodation data to the database
      // Implement this part based on your database model and logic
      console.log('Student Accommodation Data:', studentAccommodationData);
    }
  } catch (err) {
    throw new Error('Error seeding student accommodations:', err);
  }
}




db.once('open', async () => {
  await resetData();
});
