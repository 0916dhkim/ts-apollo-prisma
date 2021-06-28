import {Server, createServer as createHttpServer} from 'http';

import {ApolloServer} from 'apollo-server-express';
import {applyMiddleware} from 'graphql-middleware';
import {createApp} from './app';
import {createContext} from './context';
import express from 'express';
import {permissions} from './permissions';
import {schema} from './schema';

const {PORT = 5000, NODE_ENV} = process.env;

const schemaWithMiddleware = applyMiddleware(schema, permissions);

const createApolloServer = (): ApolloServer =>
  new ApolloServer({
    schema: schemaWithMiddleware,
    context: createContext,
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
    subscriptions: {
      onConnect: async (connectionParams, _webSocket, _context) => {
        process.stdout.write('Connected to websocket\n');

        // Return connection parameters for context building.
        return {connectionParams};
      },
    },
  });

const initializeApolloServer = (
  apollo: ApolloServer,
  app: express.Application,
): (() => void) => {
  apollo.applyMiddleware({app});

  return (): void => {
    process.stdout.write(
      `🚀 Server ready at http://localhost:${PORT}${apollo.graphqlPath}\n`,
    );
  };
};

export const startServer = async (
  app: express.Application,
  port?: number,
): Promise<Server> => {
  const httpServer = createHttpServer(app);
  const apollo = createApolloServer();

  apollo.installSubscriptionHandlers(httpServer);

  const handleApolloServerInitilized = initializeApolloServer(apollo, app);

  return httpServer.listen({port}, () => {
    handleApolloServerInitilized();
  });
};

if (NODE_ENV !== 'test') {
  const app = createApp();

  startServer(app);
}
