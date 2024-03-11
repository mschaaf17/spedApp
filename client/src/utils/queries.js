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
`;

export const QUERY_USER = gql`
query User($username: String!) {
  user(username: $username) {
    _id
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
      _id
      createdAt
      createdBy {
        username
      }
      createdFor {
        username
      }
      endTimes
      operationalDefinition
      startDurationId
      startTimes
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
    firstName
    interventions {
      _id
      createdBy {
        username
      }
      function
      summary
      title
    }
    isAdmin
    lastName
    studentSchoolId
    students {
      username
      _id
    }
    username
  }
}
`;
export const QUERY_ACCOMMODATION_CARDS = gql`
query accommodationCards {
  accommodationCards {
    title
    image
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


export const QUERY_ACCOMMODATIONS = gql`
query accommodations {
  accommodations {
  title
  image
  username
  }
}
`;

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
