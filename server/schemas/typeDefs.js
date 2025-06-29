const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    _id: ID!
    isAdmin: Boolean
    username: String
    firstName: String
    lastName: String
    studentSchoolId: String
    students: [User!]!
    accommodations: [AccommodationList!]!
    behaviorFrequencies: [Frequency!]!
    behaviorDurations: [Duration!]!
    interventions: [InterventionList!]!
    studentViewConfig: StudentViewConfig
    breakSettings: BreakSettings
    breakHistory: [BreakRecord]
    contracts: [Contract!]!
    contractDataMeasures: [ContractMeasure!]!
  }

  type ContractMeasure {
    _id: ID!
    name: String!
    description: String
    category: String!
    isActive: Boolean!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }

  type ContractEntry {
    time: String!
    value: String!
    note: String
  }

  type ContractChartDay {
    date: String!
    entries: [ContractEntry!]!
  }

  type Contract {
    _id: ID!
    title: String!
    assignedBy: User!
    student: User!
    contractMeasures: [ContractMeasure!]!
    type: String!
    times: [String!]!
    measureType: String!
    rows: [String!]!
    chart: [ContractChartDay!]!
    notes: [String!]!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
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
    templateId: AccommodationList
    lastOffered: String
    updateStudentViewConfig(
      studentId: ID!
      showAccommodations: Boolean!
      selectedCharts: [SelectedChartInput!]!
    ): User
    updateBreakSettings(studentId: ID!, settings: BreakSettingsInput!): User
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
    templateId: ID
    isActive: Boolean
  }

  type LogEntry {
    time: String!
  }

  type Duration {
    _id: ID!
    studentId: ID
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
    isTemplate: Boolean
    templateId: ID
    isActive: Boolean
    timers: [Timer!]!
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

  type Timer {
    timerId: ID!
    startTime: String!
    endTime: String
    status: String!
    createdBy: User!
    isActive: Boolean!
  }

  type SelectedChart {
    type: String!
    id: ID
    title: String!
  }

  type StudentViewConfig {
    showAccommodations: Boolean!
    selectedCharts: [SelectedChart!]!
  }

  type BreakSettings {
    isEnabled: Boolean
    duration: Int
    hasDelay: Boolean
    delayDuration: Int
    dailyLimit: Int
  }

  input BreakSettingsInput {
    isEnabled: Boolean
    duration: Int
    hasDelay: Boolean
    delayDuration: Int
    dailyLimit: Int
  }

  input ContractEntryInput {
    time: String!
    value: String!
    note: String
  }

  input ContractChartDayInput {
    date: String!
    entries: [ContractEntryInput!]!
  }

  input CreateContractInput {
    title: String!
    studentId: ID!
    contractMeasureIds: [ID!]!
    type: String!
    times: [String!]!
    measureType: String!
    rows: [String!]!
  }

  input UpdateContractEntryInput {
    contractId: ID!
    date: String!
    time: String!
    value: String!
    note: String
  }

  type Query {
    me: User
    users: [User]
    user(identifier: String!, isUsername: Boolean!): User
    admins: [User]
    students: [User]
    accommodationList(
      isTemplate: Boolean
      isActive: Boolean
    ): [AccommodationList]
    frequency(studentId: ID, isTemplate: Boolean): [Frequency]
    duration(studentId: ID, isTemplate: Boolean): [Duration]
    timersForDuration(durationId: ID!, studentId: ID!): Duration
    getRunningTimers(studentId: ID!, behaviorTitle: String!): [Timer!]!
    interventionList(isTemplate: Boolean, isActive: Boolean): [InterventionList]
    interventionListForStudent(
      studentId: ID
      isTemplate: Boolean
      isActive: Boolean
    ): [InterventionList]
    interventionListForStudentByBehavior(
      studentId: ID
      behaviorId: ID
      isTemplate: Boolean
      isActive: Boolean
    ): [InterventionList]
    contractMeasures(category: String, isActive: Boolean): [ContractMeasure!]!
    contracts(studentId: ID, isActive: Boolean): [Contract!]!
    contract(contractId: ID!): Contract
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
    removeFrequencyTitleFromList(_id: ID!): Frequency

    addDurationTitleToList(
      behaviorTitle: String!
      operationalDefinition: String!
    ): Duration
    removeDurationTitleFromList(_id: ID!): Duration

    addAccommodationForStudent(accommodationId: ID!, studentId: ID!): User
    removeAccommodationFromStudent(accommodationId: ID!, studentId: ID!): User

    removeFrequencyBeingTrackedForStudent(
      frequencyId: ID!
      studentId: ID!
    ): User

    removeDurationBeingTrackedForStudent(durationId: ID!, studentId: ID!): User

    addDataMeasureToStudent(dataMeasureId: ID!, studentId: ID!): User

    incrementFrequency(
      frequencyId: ID!
      studentId: ID!
      date: String!
    ): Frequency
    removeFrequencyIncrement(frequencyId: ID!, studentId: ID!): Frequency

    startDurationTimer(durationId: ID!, studentId: ID!): Timer
    endDurationTimer(durationId: ID!, timerId: ID!, studentId: ID!): Timer
    resumeDurationTimer(durationId: ID!, timerId: ID!, studentId: ID!): Timer
    resetDurationTimer(durationId: ID!, timerId: ID!, studentId: ID!): Timer
    saveDurationTimer(durationId: ID!, timerId: ID!, studentId: ID!): Timer
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

    updateStudentViewConfig(
      studentId: ID!
      showAccommodations: Boolean!
      selectedCharts: [SelectedChartInput!]!
    ): User
    updateBreakSettings(studentId: ID!, settings: BreakSettingsInput!): User
    takeBreak(studentId: ID!): User
    endBreak(studentId: ID!): User

    createContract(input: CreateContractInput!): Contract
    updateContractEntry(input: UpdateContractEntryInput!): Contract
    deleteContract(contractId: ID!): Contract
    addContractToStudent(contractId: ID!, studentId: ID!): User
    addContractMeasureToStudent(contractMeasureId: ID!, studentId: ID!): User
    toggleContractsForStudent(studentId: ID!, enabled: Boolean!): User
    addContractMeasure(
      name: String!
      description: String!
      category: String
    ): ContractMeasure
    deleteContractMeasure(contractMeasureId: ID!): ContractMeasure
    addContractDataMeasureToStudent(
      contractMeasureId: ID!
      studentId: ID!
    ): User
    removeContractDataMeasureFromStudent(
      contractMeasureId: ID!
      studentId: ID!
    ): User
    updateContractActiveStatus(contractId: ID!, isActive: Boolean!): Contract
    updateContractTimes(contractId: ID!, times: [String!]!): Contract
    updateAccommodationLastOffered(
      accommodationId: ID!
      studentId: ID!
    ): AccommodationList
    revertAccommodationLastOffered(accommodationId: ID!, studentId: ID!, previousLastOffered: String): AccommodationList
  }

  input SelectedChartInput {
    type: String!
    id: ID
    title: String!
  }

  type BreakRecord {
    startTime: String
    endTime: String
    duration: Float
  }
`;

module.exports = typeDefs;
