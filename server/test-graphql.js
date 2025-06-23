const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./schemas/typeDefs');
const resolvers = require('./schemas/resolvers');

// Test the GraphQL schema
async function testGraphQL() {
  try {
    console.log('Testing GraphQL schema...');
    
    // Create a test server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => ({
        user: {
          _id: 'test-user-id',
          username: 'test-user',
          isAdmin: true
        }
      })
    });
    
    // Test a simple query
    const testQuery = gql`
      query TestQuery {
        me {
          _id
          username
          breakHistory {
            startTime
            endTime
            duration
          }
        }
      }
    `;
    
    const result = await server.executeOperation({
      query: testQuery
    });
    
    console.log('GraphQL test result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('GraphQL test failed:', error);
  }
}

// Connect to MongoDB and run test
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spedApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  return testGraphQL();
}).then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
}); 