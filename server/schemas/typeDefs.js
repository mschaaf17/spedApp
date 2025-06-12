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
    accommodations: [AccommodationList!]!
    behaviorFrequencies: [Frequency!]!
    behaviorDurations: [Duration!]!
    interventions: [InterventionList!]!
  }

  type AccommodationList {
    _id: ID!
    title: String!
    image: String!
    description: String!
    createdBy: [User]
    studentId: User
    isTemplate: Boolean!
    isActive: Boolean!
    createdAt: String
  }
  type DailyCounts {
    date: String!
    count: Int!    
  }

  type Frequency {
    _id: ID!
    studentId: ID!
    dailyCounts: [DailyCounts!]
    count: Int
    behaviorTitle: String!
    operationalDefinition: String!
    createdAt: String!
    updatedAt: String!
    createdBy: [User!]!
    createdFor: [User!]!
    log: [LogEntry!]
    averageCountByDay: Float
    todayTotal: Int
    mostFrequentTime: String
    isTemplate: Boolean
    isActive: Boolean
   
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
    createdFor: [User!]!
    isTemplate: Boolean!
    isActive: Boolean!
    studentId: User
    behaviorId: Frequency
    behaviorTitle: String
    createdAt: String
  }

  type Auth {
    token: ID!
    user: User
  }

  type Query {
    me: User
    users: [User]
    user(identifier: String!, isUsername: Boolean!): User
    admins: [User]
    students: [User]
    accommodationList: [AccommodationList]
    frequency(studentId: ID, isTemplate: Boolean): [Frequency]
    duration: [Duration]
    interventionList(isTemplate: Boolean, isActive: Boolean): [InterventionList]
    interventionListForStudent(studentId: ID, isTemplate: Boolean, isActive: Boolean): [InterventionList]
    interventionListForStudentByBehavior(studentId: ID, behaviorId: ID, isTemplate: Boolean, isActive: Boolean): [InterventionList]
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

    addAccommodationTemplate(
      title: String!
      image: String!
      description: String!
      isTemplate: Boolean
      isActive: Boolean
    ): AccommodationList
    removeAccommodation(_id: ID!): AccommodationList

    addFrequencyTitleToList(
      behaviorTitle: String!
      operationalDefinition: String!
    ): Frequency
    removeFrequencyTitleFromList(
      _id: ID!
    ): Frequency

    addDurationTitleToList(
      behaviorTitle: String!
      operationalDefinition: String!
    ): Duration
    removeDurationTitleFromList(
      _id: ID!
    ): Duration

    addAccommodationForStudent(accommodationId: ID!, studentId: ID!): User
    removeAccommodationFromStudent(
      accommodationId: ID!
      studentId: ID!
    ): User
    
    removeFrequencyBeingTrackedForStudent(
      frequencyId: ID!
      studentId: ID!
    ): User

    removeDurationBeingTrackedForStudent(durationId: ID!, studentId: ID!): User

    addDataMeasureToStudent(
      dataMeasureId: ID!
      studentId: ID!
    ): User
    
    incrementFrequency(frequencyId: ID!, studentId: ID!, date: String!): Frequency
    removeFrequencyIncrement(frequencyId: ID!, studentId: ID!): Frequency

    startDurationTimer(durationId: ID!, studentId: ID!): User
    endDurationTimer(durationId: ID!, startDurationId: ID!): User
    removeLastDurationTimer(studentId: ID!): User

    addInterventionTemplate(
      title: String!
      summary: String!
      function: String!
      isTemplate: Boolean
      isActive: Boolean
    ): InterventionList
    removedInterventionFromList(interventionId: ID!): InterventionList

    addInterventionForStudent(
      interventionId: ID!
      studentId: ID!
      behaviorId: ID
    ): InterventionList
    removeInterventionForStudent(interventionId: ID!, studentId: ID!): User
  }
`;

module.exports = typeDefs;
