import { parseFile } from "@fast-csv/parse";
import fs from "fs/promises";
import path from "path";

const BASE = path.join(process.cwd(), "..", "..", "archive", "raw");

export type Item = {
  lang: string;
  owner: string;
  name: string;
  starsToday: number;
  stargazers: number;
  date: string;
  url: string;
};

export async function list(): Promise<Item[][][]> {
  const dates = await fs.readdir(BASE);
  return Promise.all(
    dates.map(async (d) => {
      const files = await fs.readdir(path.join(BASE, d));
      return Promise.all(
        files.map((f): Promise<Item[]> => {
          return new Promise((resolve, reject) => {
            const lang = path.basename(f, ".csv");
            const rows: Item[] = [];
            parseFile(path.join(BASE, d, f), {
              headers: true,
            })
              .on("data", (chunk) =>
                rows.push({
                  ...chunk,
                  starsToday: parseInt(chunk.starsToday, 10),
                  stargazers: parseInt(chunk.stargazers, 10),
                  lang,
                })
              )
              .on("error", reject)
              .on("end", () => resolve(rows));
          });
        })
      );
    })
  );
}
