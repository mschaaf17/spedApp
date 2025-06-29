import { gql } from '@apollo/client'

export const LOGIN_USER = gql`
mutation login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    token
  user {
    _id
    username
    isAdmin
  }  
  }
}
`;

export const ADD_USER = gql`
mutation AddUser($username: String!, $firstName: String!, $lastName: String!, $studentSchoolId: String!, $password: String!, $isAdmin: Boolean) {
  addUser(username: $username, firstName: $firstName, lastName: $lastName, studentSchoolId: $studentSchoolId, password: $password, isAdmin: $isAdmin) {
    token
    user {
      username
      lastName
      firstName
      _id
      isAdmin
      studentSchoolId
    }
  }
}
`;

export const ADD_FREQUENCY_TITLE = gql`
  mutation AddFrequencyTitleToList($behaviorTitle: String!, $operationalDefinition: String!) {
  addFrequencyTitleToList(behaviorTitle: $behaviorTitle, operationalDefinition: $operationalDefinition) {
    _id
    behaviorTitle
    operationalDefinition
    isTemplate
  }
}
`;

 export const REMOVE_FREQUENCY_TITLE= gql`
  mutation RemoveFrequencyTitleFromList($id: ID!) {
  removeFrequencyTitleFromList(_id: $id) {
    _id
  }
}
 `;

export const ADD_DURATION_TITLE = gql`
  mutation AddDurationTitleToList($behaviorTitle: String!, $operationalDefinition: String!) {
  addDurationTitleToList(behaviorTitle: $behaviorTitle, operationalDefinition: $operationalDefinition) {
    behaviorTitle
    _id
    operationalDefinition
  }
}
 `;

 export const REMOVE_DURATION_TITLE= gql`
  mutation RemoveDurationTitleFromList($id: ID!) {
  removeDurationTitleFromList(_id: $id) {
    _id
  }
}
 `;


 export const ADD_DATA_MEASURE_TO_STUDENT = gql`
mutation AddDataMeasureToStudent($dataMeasureId: ID!, $studentId: ID!) {
  addDataMeasureToStudent(dataMeasureId: $dataMeasureId, studentId: $studentId) {
    _id
    username
    firstName
    lastName
    behaviorFrequencies {
      _id
      behaviorTitle
      operationalDefinition
      createdBy {
        _id
        firstName
        lastName
        username
      }
      isTemplate
      isActive
      templateId
      dailyCounts {
        date
        count
      }
      log {
        time
      }
    }
    behaviorDurations {
      _id
      behaviorTitle
      operationalDefinition
      createdBy {
        _id
        username
        lastName
        firstName
      }
      isTemplate
      isActive
      templateId
      timers {
        timerId
        startTime
        endTime
        status
        isActive
      }
    }
  }
}
`;

export const REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT = gql`
mutation RemoveFrequencyBeingTrackedForStudent($frequencyId: ID!, $studentId: ID!) {
  removeFrequencyBeingTrackedForStudent(frequencyId: $frequencyId, studentId: $studentId) {
    _id
    behaviorFrequencies {
      _id
      behaviorTitle
    }
  }
}
`;

export const REMOVE_DURATION_BEING_TRACKED_FOR_STUDENT = gql`
mutation RemoveDurationBeingTrackedForStudent($durationId: ID!, $studentId: ID!) {
  removeDurationBeingTrackedForStudent(durationId: $durationId, studentId: $studentId) {
    _id
  }
}
`;

export const INCREMENT_FREQUENCY = gql`
mutation IncrementFrequency($frequencyId: ID!, $studentId: ID!, $date: String!) {
  incrementFrequency(frequencyId: $frequencyId, studentId: $studentId, date: $date) {
    studentId
    behaviorTitle
    dailyCounts {
      date
      count
    }
    _id
    log {
      time
    }
    count
    createdFor {
      username
      _id
      firstName
      lastName
    }
    createdBy {
      _id
      firstName
      lastName
    }
    todayTotal
  }
}
`;




export const ADD_ACCOMMODATION_TEMPLATE = gql`
mutation AddAccommodationTemplate(
  $title: String!
  $image: String!
  $description: String!
  $isTemplate: Boolean
  $isActive: Boolean
) {
  addAccommodationTemplate(
    title: $title
    image: $image
    description: $description
    isTemplate: $isTemplate
    isActive: $isActive
  ) {
    _id
    title
    image
    description
    createdBy {
      _id
      username
      firstName
      lastName
    }
    isTemplate
    isActive
  }
}
`;

export const REMOVE_ACCOMMODATION = gql`
mutation RemoveAccommodation($id: ID!) {
  removeAccommodation(_id: $id) {
    _id
    title
    description
    isTemplate
    isActive
  }
}
`;

export const ADD_ACCOMMODATION_FOR_STUDENT = gql`
mutation AddAccommodationForStudent($accommodationId: ID!, $studentId: ID!) {
  addAccommodationForStudent(accommodationId: $accommodationId, studentId: $studentId) {
    accommodations {
      title
      image
      description
      _id
      createdBy {
        _id
        lastName
        firstName
        username
      }
    }
  }
}
`;

export const REMOVE_ACCOMMODATION_FROM_STUDENT = gql`
mutation RemoveAccommodationFromStudent($accommodationId: ID!, $studentId: ID!) {
  removeAccommodationFromStudent(accommodationId: $accommodationId, studentId: $studentId) {
    _id
    username
    firstName
    lastName
    studentSchoolId
    accommodations {
      _id
      title
    }
  }
}
`;




export const ADD_BREAK = gql`
mutation AddBreak {
  addBreak {
    _id
    createdAt
  }
}
`;

export const ADD_OUT_OF_SEAT = gql`
mutation AddOutOfSeat ($username: String) {
  addOutOfSeat (username: $username) {
    username
    outOfSeatCount
      outOfSeat {
       createdAt
      }
      outOfSeatCountByDayVirtual {
        count
        createdAt
        username
      }
    }
}
`;

export const ADD_STUDENT_TO_LIST = gql`
mutation AddStudentToTeacherList($studentId: ID!) {
  addStudentToTeacherList(studentId: $studentId) {
    _id
    firstName
    studentSchoolId
    lastName
    username
  }
}
`;

export const REMOVE_STUDENT_FROM_LIST = gql`
mutation RemoveStudentFromTeacherList($studentId: ID!) {
  removeStudentFromTeacherList(studentId: $studentId) {
    _id
    username
    firstName
    lastName
    studentSchoolId
  }
}
`;

export const ADD_INTERVENTION_TEMPLATE = gql`
mutation AddInterventionTemplate(
  $title: String!
  $summary: String!
  $function: String!
  $isTemplate: Boolean
  $isActive: Boolean
) {
  addInterventionTemplate(
    title: $title
    summary: $summary
    function: $function
    isTemplate: $isTemplate
    isActive: $isActive
  ) {
    _id
    title
    summary
    function
    createdBy {
      _id
      username
      firstName
      lastName
    }
    isTemplate
    isActive
  }
}
`;

export const ADD_INTERVENTION_FOR_STUDENT = gql`
mutation AddInterventionForStudent($interventionId: ID!, $studentId: ID!, $behaviorId: ID) {
  addInterventionForStudent(interventionId: $interventionId, studentId: $studentId, behaviorId: $behaviorId) {
    _id
    title
    summary
    function
    createdBy {
      _id
      username
      firstName
      lastName
    }
    isTemplate
    isActive
    studentId {
      _id
      username
      firstName
      lastName
    }
  }
}
`;

export const REMOVE_INTERVENTION = gql`
mutation RemoveIntervention($id: ID) {
  removeIntervention(_id: $id) {
    _id
    function
    summary
    title
    username
  }
}
`;

export const REMOVE_INTERVENTION_FROM_STUDENT = gql`
mutation RemoveInterventionForStudent($interventionId: ID!, $studentId: ID!) {
  removeInterventionForStudent(interventionId: $interventionId, studentId: $studentId) {
    _id
    username
    firstName
    lastName
    studentSchoolId
    interventions {
      _id
      title
    }
  }
}
`;

export const REMOVED_INTERVENTION_FROM_LIST = gql`
mutation RemovedInterventionFromList($interventionId: ID!) {
  removedInterventionFromList(interventionId: $interventionId) {
    _id
    title
    summary
    function
    isTemplate
    isActive
  }
}
`;

//Start a new timer for a duration
export const START_DURATION_TIMER = gql`
mutation StartDurationTimer($durationId: ID!, $studentId: ID!) {
  startDurationTimer(durationId: $durationId, studentId: $studentId) {
    timerId
    startTime
    endTime
    status
    isActive
  }
}
`;

// End a specific timer
export const END_DURATION_TIMER = gql`
mutation EndDurationTimer($durationId: ID!, $timerId: ID!, $studentId: ID!) {
  endDurationTimer(durationId: $durationId, timerId: $timerId, studentId: $studentId) {
    timerId
    startTime
    endTime
    status
    isActive
  }
}
`;

// Resume a stopped timer
export const RESUME_DURATION_TIMER = gql`
mutation ResumeDurationTimer($durationId: ID!, $timerId: ID!, $studentId: ID!) {
  resumeDurationTimer(durationId: $durationId, timerId: $timerId, studentId: $studentId) {
    timerId
    startTime
    endTime
    status
    isActive
  }
}
`;

// Reset a timer
export const RESET_DURATION_TIMER = gql`
mutation ResetDurationTimer($durationId: ID!, $timerId: ID!, $studentId: ID!) {
  resetDurationTimer(durationId: $durationId, timerId: $timerId, studentId: $studentId) {
    timerId
    startTime
    endTime
    status
    isActive
  }
}
`;

// Save a timer
export const SAVE_DURATION_TIMER = gql`
mutation SaveDurationTimer($durationId: ID!, $timerId: ID!, $studentId: ID!) {
  saveDurationTimer(durationId: $durationId, timerId: $timerId, studentId: $studentId) {
    timerId
    startTime
    endTime
    status
    isActive
  }
}
`;

export const UPDATE_STUDENT_VIEW_CONFIG = gql`
mutation UpdateStudentViewConfig($studentId: ID!, $showAccommodations: Boolean!, $selectedCharts: [SelectedChartInput!]!) {
  updateStudentViewConfig(studentId: $studentId, showAccommodations: $showAccommodations, selectedCharts: $selectedCharts) {
    _id
    username
    firstName
    lastName
    studentViewConfig {
      showAccommodations
      selectedCharts {
        type
        id
        title
      }
    }
  }
}
`;

export const UPDATE_BREAK_SETTINGS = gql`
  mutation UpdateBreakSettings($studentId: ID!, $settings: BreakSettingsInput!) {
    updateBreakSettings(studentId: $studentId, settings: $settings) {
      _id
      breakSettings {
        isEnabled
        duration
        hasDelay
        delayDuration
        dailyLimit
      }
    }
  }
`;

export const TAKE_BREAK = gql`
  mutation takeBreak($studentId: ID!) {
    takeBreak(studentId: $studentId) {
      _id
      breakHistory {
        startTime
        endTime
        duration
      }
    }
  }
`;

export const END_BREAK = gql`
  mutation endBreak($studentId: ID!) {
    endBreak(studentId: $studentId) {
      _id
      breakHistory {
        startTime
        endTime
        duration
      }
    }
  }
`;

// Contract Mutations
export const CREATE_CONTRACT = gql`
  mutation CreateContract($input: CreateContractInput!) {
    createContract(input: $input) {
      _id
      title
      assignedBy {
        _id
        firstName
        lastName
      }
      student {
        _id
        firstName
        lastName
      }
      contractMeasures {
        _id
        name
        description
        category
      }
      type
      times
      measureType
      rows
      chart {
        date
        entries {
          time
          value
          note
        }
      }
      notes
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CONTRACT_ENTRY = gql`
  mutation UpdateContractEntry($input: UpdateContractEntryInput!) {
    updateContractEntry(input: $input) {
      _id
      title
      chart {
        date
        entries {
          time
          value
          note
        }
      }
    }
  }
`;

export const DELETE_CONTRACT = gql`
  mutation DeleteContract($contractId: ID!) {
    deleteContract(contractId: $contractId) {
      _id
      title
    }
  }
`;

export const UPDATE_CONTRACT_ACTIVE_STATUS = gql`
  mutation UpdateContractActiveStatus($contractId: ID!, $isActive: Boolean!) {
    updateContractActiveStatus(contractId: $contractId, isActive: $isActive) {
      _id
      title
      contractMeasures {
        _id
        name
        description
        category
      }
      type
      times
      measureType
      rows
      chart {
        date
        entries {
          time
          value
          note
        }
      }
      notes
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const ADD_CONTRACT_TO_STUDENT = gql`
  mutation AddContractToStudent($contractId: ID!, $studentId: ID!) {
    addContractToStudent(contractId: $contractId, studentId: $studentId) {
      _id
      username
      firstName
      lastName
      contracts {
        _id
        title
        contractMeasures {
          _id
          name
          description
          category
        }
        type
        times
        measureType
        rows
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

export const ADD_CONTRACT_MEASURE = gql`
  mutation AddContractMeasure($name: String!, $description: String!, $category: String) {
    addContractMeasure(name: $name, description: $description, category: $category) {
      _id
      name
      description
      category
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CONTRACT_MEASURE = gql`
  mutation DeleteContractMeasure($contractMeasureId: ID!) {
    deleteContractMeasure(contractMeasureId: $contractMeasureId) {
      _id
      name
      description
      category
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const ADD_CONTRACT_MEASURE_TO_STUDENT = gql`
  mutation AddContractMeasureToStudent($contractMeasureId: ID!, $studentId: ID!) {
    addContractMeasureToStudent(contractMeasureId: $contractMeasureId, studentId: $studentId) {
      _id
      username
      firstName
      lastName
      contracts {
        _id
        title
        contractMeasures {
          _id
          name
          description
          category
        }
        type
        times
        measureType
        rows
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

export const TOGGLE_CONTRACTS_FOR_STUDENT = gql`
  mutation ToggleContractsForStudent($studentId: ID!, $enabled: Boolean!) {
    toggleContractsForStudent(studentId: $studentId, enabled: $enabled) {
      _id
      username
      firstName
      lastName
      interventions {
        _id
        title
        summary
        function
        isActive
      }
    }
  }
`;

export const ADD_CONTRACT_DATA_MEASURE_TO_STUDENT = gql`
  mutation AddContractDataMeasureToStudent($contractMeasureId: ID!, $studentId: ID!) {
    addContractDataMeasureToStudent(contractMeasureId: $contractMeasureId, studentId: $studentId) {
      _id
      username
      firstName
      lastName
      contractDataMeasures {
        _id
        name
        description
        category
        isActive
      }
    }
  }
`;

export const REMOVE_CONTRACT_DATA_MEASURE_FROM_STUDENT = gql`
  mutation RemoveContractDataMeasureFromStudent($contractMeasureId: ID!, $studentId: ID!) {
    removeContractDataMeasureFromStudent(contractMeasureId: $contractMeasureId, studentId: $studentId) {
      _id
      username
      firstName
      lastName
      contractDataMeasures {
        _id
        name
        description
        category
        isActive
      }
    }
  }
`;

export const UPDATE_CONTRACT_TIMES = gql`
  mutation UpdateContractTimes($contractId: ID!, $times: [String!]!) {
    updateContractTimes(contractId: $contractId, times: $times) {
      _id
      times
      updatedAt
    }
  }
`;

export const UPDATE_ACCOMMODATION_LAST_OFFERED = gql`
  mutation UpdateAccommodationLastOffered($accommodationId: ID!, $studentId: ID!) {
    updateAccommodationLastOffered(accommodationId: $accommodationId, studentId: $studentId) {
      _id
      title
      lastOffered
    }
  }
`;

export const REVERT_ACCOMMODATION_LAST_OFFERED = gql`
  mutation RevertAccommodationLastOffered($accommodationId: ID!, $studentId: ID!, $previousLastOffered: String) {
    revertAccommodationLastOffered(accommodationId: $accommodationId, studentId: $studentId, previousLastOffered: $previousLastOffered) {
      _id
      title
      lastOffered
    }
  }
`;