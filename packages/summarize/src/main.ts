#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { setTimeout } from "timers/promises";
import { finished } from "stream/promises";
import { parseFile } from "@fast-csv/parse";
import { format } from "@fast-csv/format";
import {
  isNotFoundError,
  isRateLimitedError,
  getMetaInfo,
  getStarCountInThisRange,
} from "./github";
import { inRange } from "./date";

type Row = {
  date: string;
  language: string;
  stargazers: string;
  starsToday: string;
  description: string;
  owner: string;
  name: string;
  url: string;
};
type CacheEntry = {
  description: string;
  topics: string;
  createdAt: string;
  createdInThisRange: number;
  starCountInThisRange: number;
  starCountAtEnding: number;
  starCountAtBeginning: number;
};
// Entry can be false if the repository does not exist
type Cache = Record<string, CacheEntry | false>;

const BASE = path.join(__dirname, "..", "..", "..", "archive", "raw");

async function readCache(): Promise<Cache> {
  try {
    return JSON.parse(await fs.readFile("./.cache.json", "utf8"));
  } catch {
    return {};
  }
}
async function updateCache(patch: Cache): Promise<Cache> {
  const cache = { ...(await readCache()), ...patch };
  await fs.writeFile("./.cache.json", JSON.stringify(cache), "utf8");
  return cache;
}

async function main({
  since,
  until,
  languages,
  token,
}: {
  since: string;
  until: string;
  languages: string[];
  token: string;
}) {
  function renderProgress(message?: string) {
    const completed = Object.keys(cache).length;
    const total = uniqSlugs.length;
    const percentage = (completed / total) * 100;
    process.stderr.write(
      `\r${" ".repeat(
        process.stderr.columns
      )}\r${completed}/${total} (${percentage.toFixed(1)}%) ${message}`
    );
  }

  let cache = await readCache();
  const targetFiles = (await fs.readdir(BASE))
    .filter((d) => since <= d && d <= until)
    .flatMap((d) => languages.map((l) => path.join(BASE, d, `${l}.csv`)));
  const rows: Row[] = await Promise.all(
    targetFiles.map((f) => {
      return new Promise<Row[]>((resolve, reject) => {
        const rows: Row[] = [];
        parseFile(f, { headers: true })
          .on("error", reject)
          .on("data", (row) => rows.push(row))
          .on("end", () => {
            resolve(rows);
          });
      });
    })
  ).then((groups) => groups.flat());
  const uniqSlugs = [
    ...new Set(rows.map((row) => row.owner + "/" + row.name)),
  ].sort();

  const dist = format({ headers: true });
  dist.pipe(process.stdout);

  for (const slug of uniqSlugs) {
    async function retrieveData() {
      const repository = await getMetaInfo({ owner, name, token });
      const starCountAtEnding = repository.stargazers.totalCount;
      const createdAt = new Date(repository.createdAt);
      const createdInThisRange = inRange(
        createdAt,
        new Date(since),
        new Date(until)
      );
      const starCountInThisRange = await getStarCountInThisRange({
        owner,
        name,
        token,
        since: new Date(since),
        until: new Date(until),
      });
      const starCountAtBeginning = starCountAtEnding - starCountInThisRange;
      return {
        description: repository.description,
        topics: repository.repositoryTopics.edges
          .map(({ node }) => node.topic.name)
          .join(","),
        createdAt: createdAt.toISOString(),
        createdInThisRange: createdInThisRange ? 1 : 0,
        starCountInThisRange,
        starCountAtEnding,
        starCountAtBeginning,
      };
    }
    async function retrieveDataAndCache() {
      try {
        cache = await updateCache({
          [slug]: await retrieveData(),
        });
      } catch (e) {
        if (isNotFoundError(e)) {
          cache = await updateCache({ [slug]: false });
        } else if (isRateLimitedError(e)) {
          const resetAt = Number(e.headers["x-ratelimit-reset"]) * 1000;
          renderProgress(
            `Waiting for rate limit to be reset until ${new Date(
              resetAt
            ).toLocaleString()}`
          );
          await setTimeout(resetAt - Date.now());
          await retrieveDataAndCache();
        } else {
          throw e;
        }
      }
    }

    const [owner, name] = slug.split("/");
    if (cache[slug] === false) {
      continue;
    }
    if (!cache[slug]) {
      await retrieveDataAndCache();
    }
    const appearedCount = rows.filter(
      (row) => row.owner === owner && row.name === name
    ).length;
    dist.write({ ...cache[slug], owner, name, appearedCount });
    renderProgress("In progress...");
  }
  dist.end();
  await finished(dist);
}

const token = process.env.GITHUB_TOKEN;
const [since, until, languages] = process.argv.slice(2);
if (!since || !until || !languages || !token) {
  const fileName = path.basename(__filename);
  console.error(
    `Usage: GITHUB_TOKEN=xxx node ${fileName} <since> <until> <languages>`
  );
  process.exit(1);
}
main({
  since,
  until,
  languages: languages.split(","),
  token,
});
