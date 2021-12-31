import { NextApiHandler } from "next";
import { apolloServer } from "../../src/app";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handleReady = apolloServer
  .start()
  .then(() => apolloServer.createHandler({ path: "/api/graphql" }));

const handler: NextApiHandler = (req, res) => {
  return handleReady.then((handle) => handle(req, res));
};

export default handler;
