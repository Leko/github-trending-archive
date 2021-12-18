import path from "path";
import fs from "fs";
import { ApolloServer, gql, Config } from "apollo-server-micro";
import * as resolvers from "./resolvers";

const SCHEMA_PATH = path.join(__dirname, "..", "schema.graphql");

export const typeDefs: Config["typeDefs"] = gql`
  ${fs.readFileSync(SCHEMA_PATH, "utf8")}
`;

export const apolloServer = new ApolloServer({ typeDefs, resolvers });
