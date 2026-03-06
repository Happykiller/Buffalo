import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    HttpLink,
    split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './App.css';
import { APP_NAME } from './config';

document.title = `🐃 ${APP_NAME} — Bureau des Demandes`;

const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
    metaDescription.setAttribute('content', `${APP_NAME} — Le bureau des demandes absurdes`);
}

const httpLink = new HttpLink({ uri: '/graphql' });

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsLink = new GraphQLWsLink(
    createClient({
        url: `${wsProtocol}//${window.location.host}/graphql`,
    }),
);

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    httpLink,
);

const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ApolloProvider client={client}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ApolloProvider>
    </React.StrictMode>,
);
