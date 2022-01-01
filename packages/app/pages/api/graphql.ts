import "reflect-metadata";

import fs from "fs";
import path from "path";
import { createConnection } from "typeorm";
import type { PageConfig, NextApiHandler } from "next";
import { apolloServer } from "../../src/app";
import * as entitiesMap from "../../src/entity";

console.log("cwd:", process.cwd());
console.log("ls:", fs.readdirSync(process.cwd()));
console.log(
  "ls node_modules/sql.js:",
  fs.readdirSync(path.join(process.cwd(), "node_modules", "sql.js"))
);
console.log(
  "ls node_modules/sql.js/dist:",
  fs.readdirSync(path.join(process.cwd(), "node_modules", "sql.js", "dist"))
);

// For the output file tracing
// https://nextjs.org/docs/advanced-features/output-file-tracing
const _notUsedButRequired = fs.readFileSync(
  path.join(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm")
);

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
  unstable_includeFiles: [
    path.join(__dirname, "../../node_modules/sql.js/dist/**/*"),
  ],
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
