const mongoose = require('mongoose');
const User = require('./models/User');
const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server-express');
const typeDefs = require('./schemas/typeDefs');
const resolvers = require('./schemas/resolvers');

async function testBreakData() {
  try {
    console.log('Creating test user with break history...');
    
    // Create a test user
    const testUser = new User({
      username: 'teststudent',
      firstName: 'Test',
      lastName: 'Student',
      password: 'password123',
      isAdmin: false,
      studentSchoolId: 'TEST001',
      breakSettings: {
        isEnabled: true,
        duration: 5,
        hasDelay: false,
        delayDuration: 15,
        dailyLimit: 3
      },
      breakHistory: [
        {
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T10:05:00Z'),
          duration: 5
        },
        {
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: null,
          duration: null
        },
        // Test with some edge cases
        null, // This should be filtered out
        {
          startTime: null, // This should be filtered out
          endTime: new Date('2024-01-15T16:00:00Z'),
          duration: 3
        }
      ]
    });
    
    await testUser.save();
    console.log('Test user created with ID:', testUser._id);
    
    // Create a test admin user
    const adminUser = new User({
      username: 'testadmin',
      firstName: 'Test',
      lastName: 'Admin',
      password: 'password123',
      isAdmin: true,
      students: [testUser._id]
    });
    
    await adminUser.save();
    console.log('Test admin created with ID:', adminUser._id);
    
    // Test GraphQL query
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => ({
        user: {
          _id: adminUser._id.toString(),
          username: adminUser.username,
          isAdmin: true
        }
      })
    });
    
    const testQuery = gql`
      query TestQuery {
        me {
          _id
          username
          students {
            _id
            username
            breakHistory {
              startTime
              endTime
              duration
            }
            breakSettings {
              isEnabled
              duration
              dailyLimit
            }
          }
        }
      }
    `;
    
    const result = await server.executeOperation({
      query: testQuery
    });
    
    console.log('GraphQL test result:', JSON.stringify(result, null, 2));
    
    // Clean up
    await User.deleteMany({ username: { $in: ['teststudent', 'testadmin'] } });
    console.log('Test data cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Connect to MongoDB and run test
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spedApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  return testBreakData();
}).then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
}); 