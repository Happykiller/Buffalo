import { gql } from '@apollo/client';

export const GET_REQUESTS = gql`
  query GetRequests($status: RequestStatus, $criticality: Criticality, $search: String, $page: Int, $pageSize: Int) {
    requests(status: $status, criticality: $criticality, search: $search, page: $page, pageSize: $pageSize) {
      items {
        id
        requestNumber
        userDisplayName
        message
        url
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

export const GET_OPEN_REQUESTS_COUNT = gql`
  query GetOpenRequestsCount {
    requests(status: OPEN, page: 1, pageSize: 1) {
      total
    }
  }
`;

export const GET_BACKEND_VERSION = gql`
  query GetBackendVersion {
    backendVersion
  }
`;

export const GET_STATS = gql`
  query GetStats {
    stats {
      totalRequests
      openRequests
      doneRequests
      byLow
      byMedium
      byHigh
      byUrgent
      avgProcessingTimeMs
      totalRequesters
      topRequesters {
        userDisplayName
        totalCount
        openCount
        doneCount
        urgentCount
      }
    }
  }
`;

export const GET_USER_REQUESTS = gql`
  query GetUserRequests($userDisplayName: String!, $status: RequestStatus, $limit: Int) {
    userRequests(userDisplayName: $userDisplayName, status: $status, limit: $limit) {
      items {
        id
        requestNumber
        message
        url
        criticality
        createdAt
        processedAt
        status
      }
      total
    }
  }
`;
