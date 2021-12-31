import type { NextPage } from "next";
import Head from "next/head";
import { Item, list } from "../data/loader";
import styles from "../styles/Health.module.css";

type Props = {
  posts: Item[][][];
};

function assertDate(date: Item[][]) {
  return date.flatMap(assertLanguageItems).find((err) => !!err);
}
function assertLanguageItems(language: Item[]) {
  return language.flatMap(assertItem).find((err) => !!err);
}
function assertItem(item: Item) {
  if (!/\d{4}-\d{2}-\d{2}/.test(item.date)) {
    return `Invalid date: ${JSON.stringify(item.date)}`;
  }
  if (!item.language) {
    return "`language` is missing";
  }
  if (!item.name) {
    return "`name` is missing";
  }
  if (!item.owner) {
    return "`owner` is missing";
  }
  if (!item.url) {
    return "`url` is missing";
  }
  if (item.stargazers && !isFinite(item.stargazers)) {
    return `\`stargazers\` is invalid: ${JSON.stringify(item.stargazers)}`;
  }
  if (item.starsToday && !isFinite(item.starsToday)) {
    return "`starsToday` is invalid";
  }
}

function AssertionResult({ error }: { error: string | undefined }) {
  if (error) {
    console.log({ error });
    return (
      <span className={styles.icon} title={error}>
        ❌
      </span>
    );
  }
  return <span className={styles.icon}>✅</span>;
}

const Home: NextPage<Props> = ({ posts }) => {
  return (
    <div>
      <Head>
        <title>Health check</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className={styles.root}>
        <h1>Health check</h1>
        {[...posts].reverse().map((date, i) => (
          <details className={styles.foldable} key={i} open={i === 0}>
            <summary>
              <AssertionResult error={assertDate(date)} />
              {date.filter((l) => l.length)[0][0]?.date || "-"}
            </summary>
            {date
              .filter((l) => l.length)
              .map((l, j) => (
                <details className={styles.foldable} key={l[0]?.language ?? j}>
                  <summary>
                    <AssertionResult error={assertLanguageItems(l)} />
                    {l[0]?.language ?? ""} : {l.length}
                  </summary>
                  <ul>
                    {l
                      .sort((a, b) => b.starsToday - a.starsToday)
                      .map((item) => (
                        <li key={`${item.owner}/${item.name}`}>
                          <AssertionResult error={assertItem(item)} />
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            (+{item.starsToday ?? "-"}) {item.owner}/{item.name}
                            ⭐️ {item.stargazers ?? "-"}
                          </a>
                        </li>
                      ))}
                  </ul>
                </details>
              ))}
          </details>
        ))}
      </main>
    </div>
  );
};

export async function getStaticProps(): Promise<{ props: Props }> {
  const posts = await list();
  return {
    props: {
      posts,
    },
  };
}

export default Home;
