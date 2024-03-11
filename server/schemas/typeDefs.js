const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    _id: ID!
    isAdmin: Boolean!
    username: String!
    firstName: String!
    lastName: String!
    password: String!
    studentSchoolId: String!
    students: [User!]!
    accommodations: [AccommodationCards!]!
    behaviorFrequencies: [Frequency!]!
    behaviorDurations: [Duration!]!
    interventions: [InterventionList!]!
  }

  type AccommodationCards {
    _id: ID!
    title: String!
    image: String!
    description: String!
    createdBy: [User]
  }

  type Frequency {
    _id: ID!
    count: Int!
    behaviorTitle: String!
    operationalDefinition: String!
    createdAt: String!
    updatedAt: String!
    createdBy: [User!]!
    createdFor: [User!]!
    log: [LogEntry!]
    averageCountByDay: Float
    totalCount: Int
    mostFrequentTime: String
  }

  type LogEntry {
    time: String!
  }

  type Duration {
    _id: ID!
    duration: String!
    behaviorTitle: String!
    operationalDefinition: String!
    createdAt: String
    startTimes: [String]!
    startDurationId: [ID]!
    endTimes: [String]!
    createdBy: [User!]!
    createdFor: [User!]!
    averageTimeSpentDaily: String!
    timeMostOccurrences: String!
  }

  type InterventionList {
    _id: ID!
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
    login(username: String!, password: String!, isAdmin: Boolean): Auth
    addUser(
      username: String!
      firstName: String!
      lastName: String!
      studentSchoolId: String!
      password: String!
      isAdmin: Boolean
    ): Auth
    removeUser(_id: ID): User

    addStudentToTeacherList(studentId: ID!): User
    removeStudentFromTeacherList(studentId: ID!): User

    addAccommodationCard(
      title: String!
      image: String!
      description: String!
    ): AccommodationCards
    removeAccommodationCard(_id: ID!): AccommodationCards

    addAccommodationForStudent(accommodationCardId: ID!, studentId: ID!): User
    removeAccommodationFromStudent(
      accommodationCardId: ID!
      studentId: ID!
    ): User

    addFrequencyTitleToTrack(
      behaviorTitle: String!
      operationalDefinition: String!
      studentId: ID!
    ): User
    removeFrequencyTitleBeingTracked(frequencyId: ID!, studentId: ID!): User

    addDurationTitleToTrack(
      behaviorTitle: String!
      operationalDefinition: String!
      studentId: ID!
    ): User
    removeDurationTitleBeingTracked(durationId: ID!, studentId: ID!): User

    frequencyIncreased(frequencyId: ID!, studentId: ID!): User
    removeFrequencyIncrement(frequencyId: ID!, studentId: ID!): User

    startDurationTimer(durationId: ID!, studentId: ID!): User
    endDurationTimer(durationId: ID!, startDurationId: ID!): User
    removeLastDurationTimer(studentId: ID!): User

    addToInterventionList(
      title: String!
      summary: String!
      function: String!
    ): InterventionList
    removedInterventionFromList(interventionId: ID!): InterventionList

    addInterventionForStudent(interventionId: ID!, studentId: ID!): User
    removeInterventionForStudent(interventionId: ID!, studentId: ID!): User
  }
`;

module.exports = typeDefs;
