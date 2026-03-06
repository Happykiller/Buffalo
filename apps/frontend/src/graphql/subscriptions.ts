import { gql } from '@apollo/client';

export const REQUEST_CREATED_SUBSCRIPTION = gql`
  subscription RequestCreated {
    requestCreated {
      id
      requestNumber
      userDisplayName
      message
      criticality
      status
      themeKey
      createdAt
      processedAt
    }
  }
`;

export const REQUEST_UPDATED_SUBSCRIPTION = gql`
  subscription RequestUpdated {
    requestUpdated {
      id
      requestNumber
      userDisplayName
      message
      criticality
      status
      themeKey
      createdAt
      processedAt
    }
  }
`;
