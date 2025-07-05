const mongoose = require('mongoose');
const User = require('../models/User');
const Frequency = require('../models/Frequency');
const InterventionList = require('../models/InterventionList');
const AccommodationList = require('../models/AccommodationList');
const Duration = require('../models/Duration');
const ContractMeasure = require('../models/ContractMeasure');
const Contract = require('../models/Contract');


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/inclusion-student-app';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  // Optional: Clear existing data
  await User.deleteMany({});
  await Frequency.deleteMany({});
  await InterventionList.deleteMany({});
  await AccommodationList.deleteMany({});
  await Duration.deleteMany({});
  await ContractMeasure.deleteMany({});


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
    behaviorTitle: 'Tapping',
    operationalDefinition: 'Student taps fingers on desk',
    createdBy: admin._id,
    isTemplate: true,
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



  const frequencyTemplate2 = await Frequency.create({
    behaviorTitle: 'Throwing Objects',
    operationalDefinition: 'Student throws objects',
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
    templateId: frequencyTemplate._id,
    createdAt: new Date('2025-06-07T00:00:00.000Z'),
    dailyCounts: [
      { date: '2025-06-07T00:00:00.000Z', count: 3 },
      { date: '2025-06-09T00:00:00.000Z', count: 8 },
      { date: '2025-06-10T00:00:00.000Z', count: 2 },
      { date: '2025-06-12T00:00:00.000Z', count: 0 },
      { date: '2025-06-13T00:00:00.000Z', count: 10 },
      { date: '2025-06-14T00:00:00.000Z', count: 11 },
      { date: '2025-06-15T00:00:00.000Z', count: 15 },
    ],
    count: 49 // total count (3 + 8)
  });

  // Create an intervention template
  const interventionTemplate = await InterventionList.create({
    title: 'Teacher Helper',
    summary: 'Helping the teacher as a reward',
    function: 'Attention',
    createdBy: admin._id,
    isTemplate: true,
    isActive: true,
    createdAt: new Date('2025-06-07T00:00:00.000Z')
  });

  const interventionTemplate1 = await InterventionList.create({
    title: 'Breaks',
    summary: 'Student will take breaks when needed',
    function: 'Escape',
    createdBy: admin._id,
    isTemplate: true,
    isActive: true,
    createdAt: new Date('2025-06-07T00:00:00.000Z')
  });


  // Assign intervention to student for a behavior
  const assignedIntervention = await InterventionList.create({
    title: 'Teacher Helper',
    summary: 'Helping the teacher as a reward',
    function: 'Attention',
    createdBy: admin._id,
    studentId: student._id,
    behaviorId: callingOutFrequency._id,
    behaviorTitle: callingOutFrequency.behaviorTitle,
    isTemplate: false,
    isActive: true,
    createdAt: new Date('2025-06-08T00:00:00.000Z')
  });


  const accommodationTemplate = await AccommodationList.create({
    title: 'Seat Away',
    description: 'Student will sit away from peers',
    image: '../uploads/1749789792434-8828269.jpeg',
    createdBy: admin._id,
    isTemplate: true,
    isActive: true,
    createdAt: new Date('2025-06-07T00:00:00.000Z')
  });

  

  // Assign to student
  const assignedAccommodation = await AccommodationList.create({
    title: 'Seat Away',
    description: 'Student will sit away from peers',
    image: '../uploads/1749789792434-8828269.jpeg',
    createdBy: admin._id,
    isTemplate: false,
    isActive: true,
    templateId: accommodationTemplate._id,
    studentId: student._id,
    createdAt: new Date('2025-06-08T00:00:00.000Z')
  });

  student.interventions.push(assignedIntervention._id);
  student.behaviorFrequencies.push(callingOutFrequency._id);
   student.accommodations.push(assignedAccommodation._id);
  await student.save();

  // Create a duration template for out of seat
  const durationTemplate = await Duration.create({
    behaviorTitle: 'Out of Seat',
    operationalDefinition: 'Student leaves assigned seat without permission',
    createdBy: admin._id,
    isTemplate: true,
    isActive: true,
    createdAt: new Date('2025-06-07T00:00:00.000Z')
  });

  // Create a student-specific duration instance
  const outOfSeatDuration = await Duration.create({
    behaviorTitle: durationTemplate.behaviorTitle,
    operationalDefinition: durationTemplate.operationalDefinition,
    createdBy: admin._id,
    createdFor: student._id,
    isTemplate: false,
    isActive: true,
    templateId: durationTemplate._id,
    createdAt: new Date('2025-06-08T00:00:00.000Z'),
    timers: [
      // Day 1 (2025-06-08) - 10 minutes total
      {
        startTime: new Date('2025-06-08T09:00:00.000Z'),
        endTime: new Date('2025-06-08T09:05:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      {
        startTime: new Date('2025-06-08T10:30:00.000Z'),
        endTime: new Date('2025-06-08T10:35:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 2 (2025-06-09) - 25 minutes total
      {
        startTime: new Date('2025-06-09T08:45:00.000Z'),
        endTime: new Date('2025-06-09T09:00:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      {
        startTime: new Date('2025-06-09T11:00:00.000Z'),
        endTime: new Date('2025-06-09T11:10:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 3 (2025-06-10) - 15 minutes total
      {
        startTime: new Date('2025-06-10T09:15:00.000Z'),
        endTime: new Date('2025-06-10T09:25:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      {
        startTime: new Date('2025-06-10T14:00:00.000Z'),
        endTime: new Date('2025-06-10T14:05:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 4 (2025-06-11) - 5 minutes total (improving)
      {
        startTime: new Date('2025-06-11T10:00:00.000Z'),
        endTime: new Date('2025-06-11T10:05:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 5 (2025-06-12) - 0 minutes (no timers)
      // Day 6 (2025-06-13) - 35 minutes total (worse)
      {
        startTime: new Date('2025-06-13T08:30:00.000Z'),
        endTime: new Date('2025-06-13T08:50:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      {
        startTime: new Date('2025-06-13T12:00:00.000Z'),
        endTime: new Date('2025-06-13T12:05:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 7 (2025-06-14) - 40 minutes total (worse)
      {
        startTime: new Date('2025-06-14T09:00:00.000Z'),
        endTime: new Date('2025-06-14T09:20:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      {
        startTime: new Date('2025-06-14T13:00:00.000Z'),
        endTime: new Date('2025-06-14T13:20:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 8 (2025-06-15) - 45 minutes total (worse - should trigger notification)
      {
        startTime: new Date('2025-06-15T08:00:00.000Z'),
        endTime: new Date('2025-06-15T08:25:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      {
        startTime: new Date('2025-06-15T11:00:00.000Z'),
        endTime: new Date('2025-06-15T11:20:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 9 (2025-06-16) - 50 minutes total (worse - should trigger notification)
      {
        startTime: new Date('2025-06-16T09:00:00.000Z'),
        endTime: new Date('2025-06-16T09:30:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      {
        startTime: new Date('2025-06-16T14:00:00.000Z'),
        endTime: new Date('2025-06-16T14:20:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 10 (2025-06-17) - 55 minutes total (worse - should trigger notification)
      {
        startTime: new Date('2025-06-17T08:30:00.000Z'),
        endTime: new Date('2025-06-17T08:55:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      {
        startTime: new Date('2025-06-17T12:30:00.000Z'),
        endTime: new Date('2025-06-17T13:00:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 11 (2025-06-18) - 20 minutes total (improving)
      {
        startTime: new Date('2025-06-18T10:00:00.000Z'),
        endTime: new Date('2025-06-18T10:20:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      },
      // Day 12 (2025-06-19) - 15 minutes total (improving)
      {
        startTime: new Date('2025-06-19T09:00:00.000Z'),
        endTime: new Date('2025-06-19T09:15:00.000Z'),
        status: 'saved',
        createdBy: admin._id,
        isActive: false
      }
    ]
  });

  // Assign intervention to student for the Out of Seat behavior (after duration is created)
  const outOfSeatIntervention = await InterventionList.create({
    title: 'Breaks',
    summary: 'Student will take breaks when needed',
    function: 'Escape',
    createdBy: admin._id,
    studentId: student._id,
    behaviorId: outOfSeatDuration._id,
    behaviorTitle: outOfSeatDuration.behaviorTitle,
    isTemplate: false,
    isActive: true,
    createdAt: new Date('2025-06-10T00:00:00.000Z')
  });

  student.behaviorDurations.push(outOfSeatDuration._id);
  student.interventions.push(outOfSeatIntervention._id);
  await student.save();

  // Create contract measures
  const contractMeasures = [
    {
      name: "Raise hand before speaking",
      description: "Student raises their hand and waits to be called on before speaking",
      category: "behavior",
      createdBy: admin._id
    },
    {
      name: "Stay in seat",
      description: "Student remains seated during class activities unless given permission to move",
      category: "behavior",
      createdBy: admin._id
    },
    {
      name: "Complete assigned work",
      description: "Student finishes all assigned tasks within the given time frame",
      category: "academic",
      createdBy: admin._id
    },
    {
      name: "Follow directions",
      description: "Student follows teacher instructions the first time they are given",
      category: "behavior",
      createdBy: admin._id
    },
    {
      name: "Use appropriate voice level",
      description: "Student speaks at an appropriate volume for the classroom setting",
      category: "behavior",
      createdBy: admin._id
    },
    {
      name: "Work independently",
      description: "Student completes tasks without constant supervision",
      category: "academic",
      createdBy: admin._id
    },
    {
      name: "Participate in group activities",
      description: "Student actively engages in classroom discussions and group work",
      category: "social",
      createdBy: admin._id
    },
    {
      name: "Use kind words",
      description: "Student speaks respectfully to peers and adults",
      category: "social",
      createdBy: admin._id
    },
    {
      name: "Organize materials",
      description: "Student keeps desk and materials neat and organized",
      category: "behavior",
      createdBy: admin._id
    },
    {
      name: "Ask for help when needed",
      description: "Student appropriately requests assistance when struggling with a task",
      category: "academic",
      createdBy: admin._id
    }
  ];

  const createdContractMeasures = await ContractMeasure.insertMany(contractMeasures);
  console.log(`Created ${createdContractMeasures.length} contract measures`);

  const completeAssignedWork = createdContractMeasures.find(m => m.name === "Complete assigned work");
  const followDirections = createdContractMeasures.find(m => m.name === "Follow directions");

  // Assign contract data measures to student
  student.contractDataMeasures = [
    ...(student.contractDataMeasures || []),
    completeAssignedWork._id,
    followDirections._id
  ];
  await student.save();

  // Create the contract for Student One
  const contract = await Contract.create({
    title: "Focus",
    assignedBy: admin._id,
    student: student._id,
    contractMeasures: [completeAssignedWork._id, followDirections._id],
    type: "weekly",
    times: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "14:30"],
    measureType: "smileys",
    rows: ["Complete assigned work", "Follow directions"],
    chart: [],
    notes: [],
    isActive: true,
  });

  // Add contract to student's contracts array
  student.contracts.push(contract._id);
  await student.save();

  console.log('freq._id:', frequency._id, 'userInterventions:', student.interventions);
  console.log('assignedIntervention:', assignedIntervention, 'interventionDate:', assignedIntervention.createdAt);
  console.log('assignedAccommodation:', assignedAccommodation, 'accommodationDate:', assignedAccommodation.createdAt);
  console.log('Student after adding duration:', await User.findById(student._id).populate('behaviorDurations'));
  console.log('Seed data created!');
  mongoose.disconnect();
}

seed();