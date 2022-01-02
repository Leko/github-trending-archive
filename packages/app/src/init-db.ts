import "reflect-metadata";
import { createConnection } from "typeorm";
import { Repository } from "./entity";
import { list } from "../data/loader";
import * as ormconfig from "../ormconfig";

Promise.all([createConnection(ormconfig), list()]).then(
  async ([connection, ret]) => {
    const items = ret.flatMap((item) => item.flat());

    await Repository.clear();
    await connection
      .createQueryBuilder()
      .insert()
      .into(Repository)
      .values(items)
      .execute();

    await Repository.count().then((count) =>
      console.log(`insert ${count} records`)
    );
  }
);
