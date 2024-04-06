import { gql } from '@apollo/client';

export const QUERY_ME = gql`
query Me {
  me {
    username
    _id
    students {
      username
      _id
      studentSchoolId
      lastName
      firstName
      accommodations {
        _id
        image
        description
        title
        createdBy {
          username
          _id
          firstName
          lastName
        }
      }
      behaviorDurations {
        _id
        behaviorTitle
        operationalDefinition
        createdBy {
          _id
          username
          firstName
          lastName
        }
      }
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
      }

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
      createdAt
      operationalDefinition
      endTimes
      startTimes
      startDurationId
      createdFor {
        username
      }
      createdBy {
        username
      }
    }
    behaviorFrequencies {
      _id
      behaviorTitle
      count
      createdAt
      createdBy {
        username
      }
      createdFor {
        username
      }
      log {
        time
      }
      operationalDefinition
      updatedAt
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
query User($username: String!) {
  user(username: $username) {
    _id
    username
    firstName
    isAdmin
    lastName
    studentSchoolId
    students {
      username
      _id
    }
    accommodations {
      createdBy {
        username
      }
      _id
      description
      image
      title
    }
    behaviorDurations {
      behaviorTitle
      operationalDefinition
      _id
    #   createdAt
    #   createdBy {
    #     username
    #   }
    #   createdFor {
    #     username
    #   }
    #   endTimes
    #   startDurationId
    #   startTimes
     }
    behaviorFrequencies {
      _id
      operationalDefinition
      behaviorTitle
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
    interventions {
      _id
      createdBy {
        username
      }
      function
      summary
      title
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

export const QUERY_FREQUENCY_LIST = gql`
query Frequency {
  frequency {
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

export const QUERY_INTERVENTION_LIST = gql`
query InterventionList($username: String) {
  interventionList(username: $username) {
    title
    summary
    username
    _id
    functions
  }
}
`;
