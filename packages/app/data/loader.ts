import { parseFile } from "@fast-csv/parse";
import fs from "fs/promises";
import path from "path";
import type { Repository } from "../src/generated/graphql";

const BASE = path.join(process.cwd(), "..", "..", "archive", "raw");

export type Item = Repository & {
  lang: string;
  date: string;
};

export async function list(): Promise<Item[][][]> {
  const dates = await fs.readdir(BASE);
  return Promise.all(
    dates.map(async (d) => {
      const files = await fs.readdir(path.join(BASE, d));
      return Promise.all(
        files.map((f): Promise<Item[]> => {
          const lang = path.basename(f, ".csv");
          return load(new Date(d), lang);
        })
      );
    })
  );
}

export async function load(date: Date, lang: string): Promise<Item[]> {
  const d = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((p) => String(p).padStart(2, "0"))
    .join("-");
  return new Promise((resolve, reject) => {
    const rows: Item[] = [];
    parseFile(path.join(BASE, d, `${lang}.csv`), {
      headers: true,
    })
      .on("data", (chunk) =>
        rows.push({
          ...chunk,
          starsToday: parseInt(chunk.starsToday, 10),
          stargazers: parseInt(chunk.stargazers, 10),
        })
      )
      .on("error", reject)
      .on("end", () => resolve(rows));
  });
}
