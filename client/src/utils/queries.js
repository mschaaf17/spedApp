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
      
      studentSchoolId
      
      accommodations {
  _id
  title
  image
  description
  templateId {
    _id
    title
  }
  createdBy {
    _id
    isAdmin
    username
    firstName
    lastName
  }
  createdAt
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
        templateId
      }
      behaviorDurations {
      _id
      studentId
      behaviorTitle
      operationalDefinition
      createdAt
      startTimes
      startDurationId
      endTimes
      
      isActive
      timers {
        timerId
        startTime
        endTime
        status
       
        isActive
      }
      templateId
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
      studentViewConfig {
        showAccommodations
        selectedCharts {
          type
          id
          title
        }
      }
      breakSettings {
        isEnabled
        duration
        hasDelay
        delayDuration
        dailyLimit
      }
      breakHistory
    }
    accommodations {
  _id
  title
  image
  description
  templateId {
    _id
    title
  }
  createdBy {
    _id
    isAdmin
    username
    firstName
    lastName
  }
  createdAt
}
    behaviorFrequencies {
      _id
      behaviorTitle
      isTemplate
      isActive
      templateId
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
      operationalDefinition
      createdAt
      startTimes
      startDurationId
      endTimes
      createdBy {
        _id
        username
        firstName
        lastName
      }
      isActive
      timers {
        timerId
        startTime
        endTime
        status
        createdBy {
          _id
          username
          firstName
          lastName
          isAdmin
        }
        isActive
      }
      templateId
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
    studentViewConfig {
      showAccommodations
      selectedCharts {
        type
        id
        title
      }
    }
    breakSettings {
      isEnabled
      duration
      hasDelay
      delayDuration
      dailyLimit
    }
    breakHistory
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
  templateId {
    _id
    title
  }
  createdBy {
    _id
    isAdmin
    username
    firstName
    lastName
  }
  createdAt
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
        templateId
      }
      behaviorDurations {
      _id
      studentId
      behaviorTitle
      operationalDefinition
      createdAt
      startTimes
      startDurationId
      endTimes
      
      isActive
      timers {
        timerId
        startTime
        endTime
        status
       
        isActive
      }
      templateId
    }

      interventions {
        _id
        title
        summary
        function
        behaviorId {
          _id
          behaviorTitle
          operationalDefinition
        }
        behaviorTitle
        createdAt
        createdBy {
          _id
          isAdmin
          username
          firstName
          lastName
        }
      }
      studentViewConfig {
        showAccommodations
        selectedCharts {
          type
          id
          title
        }
      }
      breakSettings {
        isEnabled
        duration
        hasDelay
        delayDuration
        dailyLimit
      }
      breakHistory
    }
    accommodations {
  _id
  title
  image
  description
  templateId {
    _id
    title
  }
  createdBy {
    _id
    isAdmin
    username
    firstName
    lastName
  }
  createdAt
}
    behaviorFrequencies {
      _id
      behaviorTitle
      operationalDefinition
      isTemplate
      isActive
      templateId
      createdAt
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
      }
      dailyCounts {
        date
        count
      }
    }
    behaviorDurations {
      _id
      behaviorTitle
      operationalDefinition
      createdAt
      startTimes
      startDurationId
      endTimes
      createdBy {
        _id
        username
        firstName
        lastName
      }
      isActive
      timers {
        timerId
        startTime
        endTime
        status
        isActive
      }
      templateId
    }

    interventions {
      _id
      title
      summary
      function
      behaviorId {
        _id
        behaviorTitle
        operationalDefinition
      }
      behaviorTitle
      createdAt
      createdBy {
        _id
        isAdmin
        username
        firstName
        lastName
      }
    }
    studentViewConfig {
      showAccommodations
      selectedCharts {
        type
        id
        title
      }
    }
    breakSettings {
      isEnabled
      duration
      hasDelay
      delayDuration
      dailyLimit
    }
    breakHistory
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
query Frequency($studentId: ID) {
  frequency(studentId: $studentId) {
    _id
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
    log {
      time
    }
    dailyCounts {
        date
        count
      }
    isTemplate
    templateId
  }
}
`;

export const QUERY_DURATION_LIST = gql`
query Duration($studentId: ID) {
  duration(studentId: $studentId) {
    _id
    behaviorTitle
    operationalDefinition
    createdBy {
      _id
      lastName
      firstName
      username
    }
    isTemplate
    templateId
    isActive
    timers {
      timerId
      startTime
      endTime
      status
      isActive
    }
  }
}
`;



export const QUERY_ACCOMMODATION_TEMPLATES = gql`
query AccommodationList($isTemplate: Boolean, $isActive: Boolean) {
  accommodationList(isTemplate: $isTemplate, isActive: $isActive) {
    _id
    title
    description
    isTemplate
    isActive
    createdAt
    image
    templateId {
      _id
      title
    }
    createdBy {
      _id
      username
      firstName
      lastName
    }
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
      studentSchoolId
    }
    behaviorId {
      _id
      behaviorTitle
      operationalDefinition
      isTemplate
      isActive
    }
    behaviorTitle
    createdAt
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

// Query for all running timers for a student and behavior
export const QUERY_RUNNING_TIMERS = gql`
query GetRunningTimers($studentId: ID!, $behaviorTitle: String!) {
  getRunningTimers(studentId: $studentId, behaviorTitle: $behaviorTitle) {
    timerId
    startTime
    endTime
    status
    isActive
  }
}
`;

// Query for all timers for a specific duration (for timer management UI)
export const QUERY_TIMERS_FOR_DURATION = gql`
  query TimersForDuration($durationId: ID!, $studentId: ID!) {
    timersForDuration(durationId: $durationId, studentId: $studentId) {
      _id
      behaviorTitle
      operationalDefinition
      createdFor
      createdAt
      isTemplate
      templateId
      isActive
      timers {
        timerId
        startTime
        endTime
        status
        isActive
      }
    }
  }
`;

export const QUERY_DURATIONS_FOR_STUDENT = gql`
  query Durations($studentId: ID!) {
    duration(studentId: $studentId) {
      _id
      behaviorTitle
      operationalDefinition
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
`;

export const QUERY_DURATION_TEMPLATES = gql`
  query DurationTemplates {
    duration(isTemplate: true) {
      _id
      behaviorTitle
      operationalDefinition
      isTemplate
      isActive
      createdAt
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
`;
