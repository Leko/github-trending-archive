import { createWriteStream } from "fs";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import Bottleneck from "bottleneck";
import { format } from "@fast-csv/format";
import { TrendingPage } from "./pageObjects/TrendingPage";

const CONCURRENCY = 12;
const ALLOW_LANGUAGES = [
  "Go",
  "JavaScript",
  "TypeScript",
  "Rust",
  "Python",
  "CSS",
  "Elixir",
  "Haskell",
  "HTML",
  "Kotlin",
  "Lua",
  "Markdown",
  "Perl",
  "PHP",
  "R",
  "Scala",
  "Shell",
  "Svelte",
  "Vue",
  "Astro",
];

function getToday() {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("-");
}

async function exportTo(
  result: { slug: string; items: Record<string, any>[] }[],
  dir: string
) {
  await fs.mkdir(dir, { recursive: true });
  return Promise.all(
    result.map((ret) => {
      return new Promise((resolve, reject) => {
        const csv = format({
          headers: [
            "date",
            "stargazers",
            "starsToday",
            "description",
            "owner",
            "name",
            "url",
          ],
        });
        const out = createWriteStream(path.join(dir, `${ret.slug}.csv`));
        csv.once("error", reject);
        out.once("finish", resolve);
        csv.pipe(out);
        console.log(ret.slug, ret.items.length);
        for (const item of ret.items) {
          csv.write({ ...item, date: getToday() });
        }
        csv.end();
      });
    })
  );
}

async function main() {
  const browser = await puppeteer.launch();
  try {
    const limiter = new Bottleneck({
      maxConcurrent: CONCURRENCY,
    });
    const entry = await TrendingPage.from(await browser.newPage());
    const languages = await entry.getLanguages().finally(() => entry.close());
    const result = await Promise.all(
      languages
        .filter((l) => ALLOW_LANGUAGES.includes(l.label))
        .map((lang) => {
          return limiter.schedule(async () => {
            const page = await TrendingPage.from(
              await browser.newPage(),
              lang.url
            );
            return {
              ...lang,
              items: await page.getRepositories().finally(() => page.close()),
            };
          });
        })
    );
    await exportTo(result, process.argv[2]);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
