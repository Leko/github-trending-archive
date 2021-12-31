import path from "path";
import fs from "fs";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer, gql, Config } from "apollo-server-micro";
import * as resolvers from "./resolvers";

const SCHEMA_PATH = path.join(process.cwd(), "schema.graphql");

export const typeDefs: Config["typeDefs"] = gql`
  ${fs.readFileSync(SCHEMA_PATH, "utf8")}
`;

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});
