import type { PageConfig, NextApiHandler } from "next";

// @ts-expect-error https://github.com/node-fetch/node-fetch/blob/HEAD/docs/v3-UPGRADE-GUIDE.md#converted-to-es-module
const fetch = (...args) =>
  // @ts-expect-error the same as above
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

function fetchTweets(slug: string) {
  return fetch(
    `https://api.twitter.com/2/tweets/counts/recent?query=url:"https://github.com/${slug}"&granularity=hour`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
      },
    }
  )
    .then((res) => res.json())
    .then((res) => {
      if (res.detail) {
        throw new Error(res.detail);
      }
      return res;
    });
}

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

const handler: NextApiHandler = (req, res) => {
  fetchTweets(req.query.slug as string)
    .then((stats) =>
      stats.data.map((stat: any) => ({
        date: stat.end,
        value: stat.tweet_count,
      }))
    )
    .then((data) => {
      res.setHeader("Cache-Control", "s-maxage=3600");
      res.setHeader("Content-Type", "application/json");
      res.status(200);
      res.send(JSON.stringify(data));
    })
    .catch((e) => {
      console.error(e);
      res.status(500);
      res.send("");
    });
};

export default handler;
