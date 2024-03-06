 const { gql } = require('apollo-server-express')

 const typeDefs = gql `

type User {
  id: ID!
  isAdmin: Boolean!
  username: String!
  password: String!
  studentId: String!
  students: [User!]!
  accommodations: [AccommodationCards!]!
  behaviorFrequencies: [Frequency!]!
  behaviorDurations: [Duration!]!
  interventions: [InterventionList!]!
}

type AccommodationCards {
  id: ID!
  title: String!
  image: String!
  description: String!
  createdBy: [User]
}

type Frequency {
  id: ID!
  count: Int!
  behaviorTitle: String!
  operationalDefinition: String!
  createdAt: String! 
  createdBy: [User!]!
  createdFor: [User!]!
  averageCountByDay: Float
  totalCount: Int
  mostFrequentTime: String
}

type Duration {
  id: ID!
  timeLength: String!
  behaviorTitle: String!
  operationalDefinition: String!
  createdAt: String! 
  endedAt: String! 
  createdBy: [User!]!
  createdFor: [User!]!
  averageTimeSpentDaily: String!
  totalLengthOfTime: String!
  timeMostOccurrences: String!
}

type InterventionList {
  id: ID!
  title: String!
  summary: String!
  function: String!
  createdBy: User!
}

type Auth {
    token: ID!
    user: User
}

 type Query {
    me: User
    users: [User]
    user(username: String!): User
    admins: [User]
    students: [User]
    accommodationCards: [AccommodationCards]
    frequency: [Frequency]
    duration: [Duration]
    interventionList: [InterventionList]

 }

type Mutation {
    login(studentId: String!, password: String!, isAdmin: Boolean): Auth
    addUser(username: String!, studentId: String!, password: String!, isAdmin: Boolean): Auth
    removeUser(_id: ID): User

    addAccommodationCard(title: String!, image: String!, description: String!): AccommodationCards
    removeAccommodationCard(_id: ID!): AccommodationCards


    addAccommodationForStudent(accommondationCardId: ID!, studentId: String): User
    removeAccommodationFromStudent(accommodationCardId: ID!, studentId: String): User
    

    addFrequencyTrackerStudentView(behaviorTitle: String!, studentId: ID!): User
    removeFrequencyTrackerStudentView(frequencyId: ID!, studentId: ID!): User


    addDurationTrackerStudentView(behaviorTitle: String!, studentId: ID!): User
    removeDurationTrackerStudentView(durationId: ID! studentId: ID!): User


    addFrequencyTrackerAdminView(behaviorTitle: String!, studentId: ID!): User
    removeFrequencyTrackerAdminView(frequencyId: ID!, studentId: ID!): User


    addDurationTrackerAdminView(behaviorTitle: String!, studentId: ID!): User
    removeDurationTrackerAdminView(durationId: ID!, studentId: ID!): User


    addInterventionForStudent(interventionId: ID!, studentId: ID!): User
    removeInterventionForStudent(interventionId: ID!, studentId: ID!): User

    addToInterventionList(title: String!, summary: String!, function: String!): InterventionList
    removedInterventionFromList(interventionId: ID!): InterventionList

}
 `;

 module.exports = typeDefs
