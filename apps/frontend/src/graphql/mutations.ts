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
