import { gql } from '@apollo/client';

export const GET_REQUESTS = gql`
  query GetRequests($status: RequestStatus, $criticality: Criticality, $search: String, $page: Int, $pageSize: Int) {
    requests(status: $status, criticality: $criticality, search: $search, page: $page, pageSize: $pageSize) {
      items {
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
      total
      page
      pageSize
      totalPages
    }
  }
`;
