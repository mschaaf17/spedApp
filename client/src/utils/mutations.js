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
  }
}
`;

 export const REMOVE_FREQUENCY_TITLE= gql`
  mutation RemoveFrequencyTitleFromList($id: ID!) {
  removeFrequencyTitleFromList(_id: $id) {
    _id
    behaviorTitle
    operationalDefinition
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
    behaviorTitle
    operationalDefinition
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
 //remove duration from student

export const ADD_ACCOMMODATION_CARD = gql`
mutation addAccommodationCard($title: String, $image: String) {
  addAccommodationCard(title: $title, image: $image) {
    image
    title
}
}
`;

export const ADD_ACCOMMODATION_FOR_STUDENT = gql`
mutation AddAccommodationForStudent($accommodationCardId: ID!, $studentId: ID!) {
  addAccommodationForStudent(accommodationCardId: $accommodationCardId, studentId: $studentId) {
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

export const ADD_INTERVENTION = gql`
mutation AddIntervention($functions: String, $title: String, $username: String, $summary: String) {
  addIntervention(functions: $functions, title: $title, username: $username, summary: $summary) {
    _id
    functions
    summary
    title
    username
  }
}
`;

export const ADD_INTERVENTION_TO_STUDENT = gql`
mutation AddInterventionToStudent($interventionId: ID!, $username: String) {
  addInterventionToStudent(interventionId: $interventionId, username: $username) {
    userInterventions {
      _id
      createdAt
      functions
      summary
      title
      username
    }
  }
}
`;

export const REMOVE_INTERVENTION = gql`
mutation RemoveIntervention($id: ID) {
  removeIntervention(_id: $id) {
    _id
    functions
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