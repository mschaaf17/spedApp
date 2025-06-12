import { gql } from '@apollo/client'

export const LOGIN_USER = gql`
mutation login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    token
  user {
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




//  export const ADD_FREQUENCY_TO_STUDENT = gql`
//   mutation AddFrequencyToTrackForStudent($frequencyId: ID!, $studentId: ID!) {
//   addFrequencyToTrackForStudent(frequencyId: $frequencyId, studentId: $studentId) {
//     _id
//     behaviorFrequencies {
//       _id
//       behaviorTitle
//       operationalDefinition
//     }
//   }
// }
//  `;
//remove frequency from student 

//  export const ADD_DURATION_TO_STUDENT = gql`
//  mutation AddDurationToTrackForStudent($durationId: ID!, $studentId: ID!) {
//   addDurationToTrackForStudent(durationId: $durationId, studentId: $studentId) {
//     _id
//     behaviorDurations {
//       _id
//       behaviorTitle
//       operationalDefinition
//     }
//   }
// }
//  `;
 export const ADD_DATA_MEASURE_TO_STUDENT = gql`
mutation AddDataMeasureToStudent($dataMeasureId: ID!, $studentId: ID!) {
  addDataMeasureToStudent(dataMeasureId: $dataMeasureId, studentId: $studentId) {
    _id
    behaviorFrequencies {
      _id
      behaviorTitle
      createdBy {
        _id
        firstName
        lastName
        username
      }
      operationalDefinition
      isTemplate
      
    }
    username
    firstName
    lastName
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
  $description: String!
  $image: String!
  $isTemplate: Boolean
  $isActive: Boolean
) {
  addAccommodationTemplate(
    title: $title
    description: $description
    image: $image
    isTemplate: $isTemplate
    isActive: $isActive
  ) {
    _id
    title
    description
    image
    isTemplate
    isActive
    createdBy {
      _id
      username
    }
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
mutation RemoveAccommodationFromStudent($accommodationId: ID!, $username: String!) {
  removeAccommodationFromStudent(accommodationId: $accommodationId, username: $username) {
    accommodations {
      title
      image
      _id
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
mutation RemoveInterventionFromStudent($interventionId: ID!, $username: String!) {
  removeInterventionFromStudent(interventionId: $interventionId, username: $username) {
    userInterventions {
      title
      _id
      username
    }
  }
}
`;