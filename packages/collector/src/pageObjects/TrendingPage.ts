import type { Page } from "puppeteer";

type Language = {
  label: string;
  slug: string;
  url: string;
};

type Repository = {
  stargazers: number;
  starsToday: number;
  description: string;
  owner: string;
  name: string;
  url: string;
};

const ENDPOINT = "https://github.com/trending?since=daily";

export class TrendingPage {
  private constructor(private page: Page) {}

  static async from(
    page: Page,
    url = ENDPOINT,
    retry = 0
  ): Promise<TrendingPage> {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector("article", { timeout: 5000 });
    } catch {
      // No items
      if (await page.$(".blankslate")) {
        return new TrendingPage(page);
      }
      // To slip pass the abuse detection
      await new Promise((resolve) => setTimeout(resolve, 10000));
      await page.screenshot({
        path: `${new URL(url).pathname.split("/").at(-1)}-retry-${retry}.png`,
      });
      if (retry > 2) {
        throw new Error("Retry limit exceeded");
      }
      return TrendingPage.from(page, url, retry + 1);
    }
    return new TrendingPage(page);
  }

  async getLanguages(): Promise<Language[]> {
    return this.page
      .$$eval('#languages-menuitems [role="menuitemradio"]', (elements) =>
        elements.map((el) => {
          const url = (el as HTMLAnchorElement).href;
          const [slug] = new URL(url).pathname.split("/").slice(-1);
          return {
            label: el.textContent!.trim(),
            slug,
            url,
          };
        })
      )
      .then((ret) => [{ url: ENDPOINT, label: "", slug: "" }].concat(ret));
  }

  async getRepositories(): Promise<Repository[]> {
    return this.page.$$eval("article", (elements) => {
      return elements.map((el) => {
        const url = (el.querySelector("h1 a") as HTMLAnchorElement)!.href;
        const description = el.querySelector("p")?.textContent?.trim() ?? "";
        const stargazers = parseInt(
          el
            .querySelector('[href$="/stargazers"]')
            ?.textContent?.trim()
            .replace(/,/g, "") ?? "",
          10
        );
        const starsToday = parseInt(
          el
            .querySelector("span .octicon-star")
            ?.parentElement?.textContent?.trim() ?? "",
          10
        );
        const [owner, name] = url.split("/").slice(-2);
        return {
          stargazers,
          starsToday,
          description,
          owner,
          name,
          url,
        };
      });
    });
  }

  close() {
    return this.page.close();
  }
}
