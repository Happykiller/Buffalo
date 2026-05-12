import { gql } from '@apollo/client';

export const CREATE_REQUEST = gql`
  mutation CreateRequest($input: CreateRequestInput!) {
    createRequest(input: $input) {
      id
      requestNumber
      message
      url
      criticality
      status
      themeKey
      createdAt
    }
  }
`;

export const MARK_REQUEST_AS_DONE = gql`
  mutation MarkRequestAsDone($requestId: String!) {
    markRequestAsDone(requestId: $requestId) {
      id
      status
      processedAt
    }
  }
`;

export const CREATE_DAILY_NOTE = gql`
  mutation CreateDailyNote($input: CreateDailyNoteInput!) {
    createDailyNote(input: $input) {
      id
    }
  }
`;

export const UPDATE_DAILY_NOTE = gql`
  mutation UpdateDailyNote($noteId: String!, $input: UpdateDailyNoteInput!) {
    updateDailyNote(noteId: $noteId, input: $input) {
      id
    }
  }
`;

export const DELETE_DAILY_NOTE = gql`
  mutation DeleteDailyNote($noteId: String!) {
    deleteDailyNote(noteId: $noteId) {
      id
    }
  }
`;

export const RESTORE_DAILY_NOTE = gql`
  mutation RestoreDailyNote($noteId: String!) {
    restoreDailyNote(noteId: $noteId) {
      id
    }
  }
`;

export const UPDATE_DAILY_FOCUS = gql`
  mutation UpdateDailyFocus($input: UpdateDailyFocusInput!) {
    updateDailyFocus(input: $input)
  }
`;

export const HEARTBEAT_DAILY_PRESENCE = gql`
  mutation HeartbeatDailyPresence($input: DailyPresenceInput!) {
    heartbeatDailyPresence(input: $input) {
      id
      lastSeenAt
    }
  }
`;
