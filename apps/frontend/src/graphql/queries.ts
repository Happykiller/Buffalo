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

export const GET_DAILY_BOARD = gql`
  query GetDailyBoard($date: String, $currentPseudo: String) {
    dailyBoard(date: $date, currentPseudo: $currentPseudo) {
      board {
        id
        date
        focus
        createdAt
        updatedAt
      }
      blockers {
        id
        authorPseudo
        column
        title
        description
        label
        url
        done
        blockedSince
        doingSince
        doneAt
        helpNeeded
        unblockAssignedTo
        deletedAt
        createdAt
        updatedAt
      }
      people {
        pseudo
        status
        donePreviously {
          id
          authorPseudo
          column
          title
          description
          label
          url
          done
          blockedSince
          doneAt
          helpNeeded
          unblockAssignedTo
          deletedAt
          createdAt
          updatedAt
        }
        todo {
          id
          authorPseudo
          column
          title
          description
          label
          url
          done
          blockedSince
          doneAt
          helpNeeded
          unblockAssignedTo
          deletedAt
          createdAt
          updatedAt
        }
        doing {
          id
          authorPseudo
          column
          title
          description
          label
          url
          done
          blockedSince
          doneAt
          helpNeeded
          unblockAssignedTo
          deletedAt
          createdAt
          updatedAt
        }
        blocked {
          id
          authorPseudo
          column
          title
          description
          label
          url
          done
          blockedSince
          doneAt
          helpNeeded
          unblockAssignedTo
          deletedAt
          createdAt
          updatedAt
        }
        done {
          id
          authorPseudo
          column
          title
          description
          label
          url
          done
          blockedSince
          doneAt
          helpNeeded
          unblockAssignedTo
          deletedAt
          createdAt
          updatedAt
        }
      }
      presence {
        id
        pseudo
        lastSeenAt
        editingSectionId
      }
      labels
      connectedCount
      savedAt
    }
  }
`;

export const GET_DAILY_HISTORY = gql`
  query GetDailyHistory($from: String, $to: String, $groupBy: DailyHistoryGroupBy, $filter: DailyHistoryFilter) {
    dailyHistory(from: $from, to: $to, groupBy: $groupBy, filter: $filter) {
      board {
        id
        date
        focus
        createdAt
        updatedAt
      }
      focus
      events {
        id
        pseudo
        kind
        title
        label
        column
        createdAt
      }
      people {
        pseudo
        items {
          id
          pseudo
          kind
          title
          label
          column
          createdAt
        }
      }
    }
  }
`;
