import { apolloServer } from "../src/app";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default apolloServer
  .start()
  .then(() => apolloServer.createHandler({ path: "/api/graphql" }));
