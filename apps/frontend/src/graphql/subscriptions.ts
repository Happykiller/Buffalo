import { gql } from '@apollo/client';

export const REQUEST_CREATED_SUBSCRIPTION = gql`
  subscription RequestCreated {
    requestCreated {
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
  }
`;

export const REQUEST_UPDATED_SUBSCRIPTION = gql`
  subscription RequestUpdated {
    requestUpdated {
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
  }
`;

export const USER_REQUEST_CREATED_SUBSCRIPTION = gql`
  subscription UserRequestCreated($userDisplayName: String!) {
    userRequestCreated(userDisplayName: $userDisplayName) {
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
  }
`;

export const USER_REQUEST_UPDATED_SUBSCRIPTION = gql`
  subscription UserRequestUpdated($userDisplayName: String!) {
    userRequestUpdated(userDisplayName: $userDisplayName) {
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
  }
`;

export const DAILY_BOARD_UPDATED_SUBSCRIPTION = gql`
  subscription DailyBoardUpdated($boardDate: String!) {
    dailyBoardUpdated(boardDate: $boardDate) {
      boardDate
      kind
      pseudo
      noteId
      occurredAt
    }
  }
`;

export const DAILY_PRESENCE_CHANGED_SUBSCRIPTION = gql`
  subscription DailyPresenceChanged($boardDate: String!) {
    dailyPresenceChanged(boardDate: $boardDate) {
      boardDate
      kind
      pseudo
      noteId
      occurredAt
    }
  }
`;
