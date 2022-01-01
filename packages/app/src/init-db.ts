import "reflect-metadata";
import { createConnection } from "typeorm";
import { Repository } from "./entity";
import { list } from "../data/loader";

Promise.all([createConnection(), list()]).then(async ([connection, ret]) => {
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
});
