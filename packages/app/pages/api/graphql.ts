import "reflect-metadata";

import { createConnection, getConnection } from "typeorm";
import { NextApiHandler } from "next";
import { apolloServer } from "../../src/app";
import * as entitiesMap from "../../src/entity";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handleReady = Promise.all([
  createConnection({
    type: "sqljs",
    location: "./db.sqlite",
    autoSave: false,
    useLocalForage: false,
    logging: true,
    synchronize: false,
    entities: Object.values(entitiesMap),
  }),
  apolloServer
    .start()
    .then(() => apolloServer.createHandler({ path: "/api/graphql" })),
]).then(([_, handler]) => handler);

const handler: NextApiHandler = (req, res) => {
  return handleReady.then((handle) => handle(req, res));
};

export default handler;
