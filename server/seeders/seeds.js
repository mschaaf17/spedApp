const mongoose = require('mongoose');
const User = require('../models/User');
const Frequency = require('../models/Frequency');
const InterventionList = require('../models/InterventionList');


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/inclusion-student-app';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  // Optional: Clear existing data
  await User.deleteMany({});
  await Frequency.deleteMany({});
  await InterventionList.deleteMany({});


  // Create users
  const admin = await User.create({
    isAdmin: true,
    username: 'admin1',
    firstName: 'Admin',
    lastName: 'User',
    password: 'password',
    studentSchoolId: 'A001'
  });

  const student = await User.create({
    isAdmin: false,
    username: 'student1',
    firstName: 'Student',
    lastName: 'One',
    password: 'password',
    studentSchoolId: 'S001'
  });

  const student2 = await User.create({
    isAdmin: false,
    username: 'student2',
    firstName: 'Student2',
    lastName: 'One',
    password: 'password',
    studentSchoolId: 'S002'
  });

 

  // Add student to admin's list
  admin.students.push(student._id);
  admin.students.push(student2._id);
  await admin.save();

  // Create a frequency (behavior)
  const frequency = await Frequency.create({
    studentId: student._id,
    behaviorTitle: 'Tapping',
    operationalDefinition: 'Student taps fingers on desk',
    createdBy: admin._id,
    isTemplate: false,
    isActive: true
  });

  // Create a frequency template (master behavior)
  const frequencyTemplate = await Frequency.create({
    behaviorTitle: 'Calling Out',
    operationalDefinition: 'Student calls out without raising hand',
    createdBy: admin._id,
    isTemplate: true,
    isActive: true
  });

  // Create a student-specific frequency with dailyCounts
  const callingOutFrequency = await Frequency.create({
    studentId: student._id,
    behaviorTitle: frequencyTemplate.behaviorTitle,
    operationalDefinition: frequencyTemplate.operationalDefinition,
    createdBy: admin._id,
    isTemplate: false,
    isActive: true,
    createdAt: new Date('2025-06-09T00:00:00.000Z'),
    dailyCounts: [
      { date: '2025-06-09T00:00:00.000Z', count: 3 },
      { date: '2025-06-11T00:00:00.000Z', count: 8 }
    ],
    count: 11 // total count (3 + 8)
  });

  // Create an intervention template
  const interventionTemplate = await InterventionList.create({
    title: 'Teacher Helper',
    summary: 'Helping the teacher as a reward',
    function: 'Attention',
    createdBy: admin._id,
    isTemplate: true,
    isActive: true
  });

  // Assign intervention to student for a behavior
  const assignedIntervention = await InterventionList.create({
    title: 'Teacher Helper',
    summary: 'Helping the teacher as a reward',
    function: 'Attention',
    createdBy: admin._id,
    studentId: student._id,
    behaviorId: frequency._id,
    behaviorTitle: frequency.behaviorTitle,
    isTemplate: false,
    isActive: true
  });

  // Add assigned intervention to student's interventions array
  student.interventions.push(assignedIntervention._id);
  student.behaviorFrequencies.push(callingOutFrequency._id);
  await student.save();


  console.log('Seed data created!');
  mongoose.disconnect();
}

seed();