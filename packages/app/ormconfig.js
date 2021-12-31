const entitiesMap = require("./src/entity");

/** @type import('typeorm').ConnectionOptions */
const config = {
  type: "sqljs",
  location: "./db.sqlite",
  autoSave: true,
  useLocalForage: false,

  synchronize: false,
  logging: false,

  entities: Object.values(entitiesMap),
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber",
  },
};

module.exports = config;
