import "reflect-metadata";

import fs from "fs";
import path from "path";
import { createConnection } from "typeorm";
import { NextApiHandler } from "next";
import { apolloServer } from "../../src/app";
import * as entitiesMap from "../../src/entity";

console.log("cwd:", process.cwd());
console.log("ls:", fs.readdirSync(process.cwd()));
console.log(
  "ls node_modules:",
  fs.readdirSync(path.join(process.cwd(), "node_modules"))
);
console.log(
  "ls node_modules/sql.js:",
  fs.readdirSync(path.join(process.cwd(), "node_modules", "sql.js"))
);

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
