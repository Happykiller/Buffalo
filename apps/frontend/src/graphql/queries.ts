import { gql } from '@apollo/client';

export const GET_REQUESTS = gql`
  query GetRequests($status: RequestStatus, $criticality: Criticality, $search: String) {
    requests(status: $status, criticality: $criticality, search: $search) {
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
