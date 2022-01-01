const fs = require("fs");
const path = require("path");

const PKG = path.join(
  __dirname,
  "..",
  ".next",
  "server",
  "pages",
  "api",
  "graphql.js.nft.json"
);

const pkg = require(PKG);
pkg.files.push("../../../../node_modules/sql.js/dist/sql-wasm.wasm");
pkg.files.push("../../../../db.sqlite");
fs.writeFileSync(PKG, JSON.stringify(pkg));
