import { gql } from '@apollo/client';

export const QUERY_ME = gql`
query Me {
  me {
    _id
    isAdmin
    username
    firstName
    lastName

    studentSchoolId
    students {
      _id
      isAdmin
      username
      firstName
      lastName
      password
      studentSchoolId
      
      accommodations {
        _id
        title
        image
        description
        createdBy {
          _id
          isAdmin
          username
          firstName
          lastName
        }
      }
      behaviorFrequencies {
        _id
        studentId
        dailyCounts {
          date
          count
        }
        count
        behaviorTitle
        operationalDefinition
        createdAt
        updatedAt
        createdBy {
          _id
          isAdmin
          username
          firstName
          lastName
        }
        createdFor {
          _id
          isAdmin
          username
          firstName
          lastName
        }
        log {
          time
        }
        averageCountByDay
        todayTotal
        mostFrequentTime
        isTemplate
        isActive
      }
      behaviorDurations {
        _id
        duration
        behaviorTitle
        operationalDefinition
        createdAt
        startTimes
        startDurationId
        endTimes
        createdBy {
          _id
          isAdmin
          username
          firstName
          lastName
        }
        createdFor {
          _id
          isAdmin
          username
          firstName
          lastName
        }
        averageTimeSpentDaily
        timeMostOccurrences
      }
      interventions {
        _id
        title
        summary
        function
        createdBy {
          _id
          isAdmin
          username
          firstName
          lastName
        }
      }
    }
    accommodations {
      _id
      title
      image
      description
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
      }
    }
    behaviorFrequencies {
      _id
      behaviorTitle
      isTemplate
      isActive
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
      }
    }
    behaviorDurations {
      _id
      behaviorTitle
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
      }
      duration
    }
    interventions {
      _id
      title
      summary
      function
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
      }
    }
  }
}
`;


export const QUERY_USERS = gql`
query Users {
  username
    _id
    students {
      username
      _id
      studentSchoolId
      lastName
      firstName
    }
    accommodations {
      _id
      createdBy {
        username
      }
      description
      image
      title
    }
    firstName
    isAdmin
    lastName
    studentSchoolId
    interventions {
      title
      _id
    }
    behaviorDurations {
      behaviorTitle
      _id
      operationalDefinition
      # createdAt
      # endTimes
      # startTimes
      # startDurationId
      # createdFor {
      #   username
      # }
      # createdBy {
      #   username
      # }
    }
    behaviorFrequencies {
      _id
      behaviorTitle
      operationalDefinition
      isActive
     
      # count
      # createdAt
      # createdBy {
      #   username
      # }
      # createdFor {
      #   username
      # }
      # log {
      #   time
      # }
      # updatedAt
    }
  }
`;

export const QUERY_USER = gql`
query User($identifier: String!, $isUsername: Boolean!) {
  user(identifier: $identifier, isUsername: $isUsername) {
    _id
    isAdmin
    username
    firstName
    lastName
    studentSchoolId
    students {
      _id
      isAdmin
      username
      firstName
      lastName
      studentSchoolId
      accommodations {
        _id
        title
        image
        description
        createdBy {
          _id
          firstName
          lastName
          username
          isAdmin
        }
      }
    }
    accommodations {
      _id
      title
      image
      description
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
        studentSchoolId
      }
    }
    behaviorFrequencies {
      _id
      studentId
      dailyCounts {
        date
        count
      }
      count
      behaviorTitle
      operationalDefinition
      createdAt
      updatedAt
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
      }
      createdFor {
        _id
        isAdmin
        username
        firstName
        lastName
        studentSchoolId
      }
      log {
        time
      }
      averageCountByDay
      todayTotal
      mostFrequentTime
      isTemplate
      isActive
    }
    behaviorDurations {
      _id
      duration
      behaviorTitle
      operationalDefinition
      createdAt
      startTimes
      startDurationId
      endTimes
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
        studentSchoolId
      }
      createdFor {
        _id
        isAdmin
        username
        firstName
        lastName
        studentSchoolId
      }
      averageTimeSpentDaily
      timeMostOccurrences
    }
  
    interventions {
      _id
      title
     
      studentId {
        _id
        username
        
      }
      isTemplate
      isActive
      behaviorId {
        behaviorTitle
        operationalDefinition
        _id
      }
      behaviorTitle
      summary
      function
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
      }
      createdAt
    }
    
  }
}
`;

export const QUERY_STUDENT_LIST = gql`
query Students {
  students {
    isAdmin
    firstName
    lastName
    studentSchoolId
    username
    _id
  }
}
`;

export const QUERY_FREQUENCY_TEMPLATES = gql`
  query FrequencyTemplates {
    frequency(isTemplate: true) {
      _id
      behaviorTitle
      operationalDefinition
      isTemplate
      isActive
      createdBy {
        _id
        username
      }
      createdFor {
        _id
        username
      }
      count
      dailyCounts {
        date
        count
      }
    }
  }
`;

export const QUERY_FREQUENCY_LIST = gql`
query Frequency($studentId: ID!) {
  frequency(studentId: $studentId) {
    _id
    studentId
    behaviorTitle
    isActive
    operationalDefinition
    createdBy {
      _id
      lastName
      firstName
      username
    }
    count
    createdFor {
      _id
      firstName
      lastName
      username
      studentSchoolId
    }
    log {
      time
    }
  }
}
`;

export const QUERY_DURATION_LIST = gql`
query Duration {
  duration {
    _id
    behaviorTitle
    operationalDefinition
    createdBy {
      _id
      lastName
      firstName
      username
  }
}
}
`;

export const QUERY_ACCOMMODATION_CARDS = gql`
query AccommodationCards {
  accommodationCards {
    _id
    createdBy {
      username
    }
    description
    image
    title
  }
}
`;
export const QUERY_BREAKS = gql`
query Break($username: String!) {
  break(username: $username) {
_id
createdAt
  }
}
`;


// export const QUERY_ACCOMMODATIONS = gql`
// query accommodations {
//   accommodations {
//   title
//   image
//   username
//   }
// }
// `;

export const QUERY_INTERVENTION_TEMPLATES = gql`
query InterventionList($isTemplate: Boolean, $isActive: Boolean) {
  interventionList(isTemplate: $isTemplate, isActive: $isActive) {
    _id
    title
    summary
    function
    createdBy {
      _id
      isAdmin
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
    behaviorId {
      _id
      behaviorTitle
      operationalDefinition
      isTemplate
      isActive
    }
    behaviorTitle
  }
}
`;

export const QUERY_ASSIGNED_INTERVENTIONS = gql`
query AssignedInterventions($isTemplate: Boolean, $isActive: Boolean) {
  interventionList(isTemplate: $isTemplate, isActive: $isActive) {
    _id
    title
    studentId { _id }
    behaviorId { _id }
    isTemplate
    isActive
  }
}
`;
