import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardContent,
  CardMedia,
  Container,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { NextPage } from "next";
import Head from "next/head";
import { Item, list } from "../data/loader";
import { RepositoryBanner } from "../src/components/RepositoryBanner";
import styles from "../styles/Health.module.css";
import { Box } from "@mui/system";

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
    <Container maxWidth="md">
      <Head>
        <title>Health check</title>
        <meta name="robots" content="noindex" />
      </Head>

      <Box marginY={2}>
        <Typography variant="h3" component="h1">
          Health check
        </Typography>
        {[...posts].reverse().map((date, i) => (
          <Accordion key={i}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              id={date.filter((l) => l.length)[0][0]?.date || "-"}
            >
              <Typography>
                <AssertionResult error={assertDate(date)} />{" "}
                {date.filter((l) => l.length)[0][0]?.date || "-"}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {date
                .filter((l) => l.length)
                .map((l, j) => (
                  <Accordion key={l[0]?.language ?? j}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      id={l[0]?.language ?? ""}
                    >
                      <AssertionResult error={assertLanguageItems(l)} />{" "}
                      <Typography sx={{ width: "50%" }}>
                        {l[0]?.language ?? ""}
                      </Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        {l.length}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {l
                        .sort((a, b) => b.starsToday - a.starsToday)
                        .map((item) => {
                          const { owner, name, stargazers, starsToday, url } =
                            item;
                          const slug = owner + "/" + name;
                          return (
                            <a
                              key={slug}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Box mb={1}>
                                <Card sx={{ display: "flex" }}>
                                  <CardMedia
                                    component={RepositoryBanner}
                                    slug={slug}
                                    width={192}
                                  />
                                  <CardContent>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      <AssertionResult
                                        error={assertItem(item)}
                                      />
                                      (+{starsToday ?? "-"}) ⭐️{" "}
                                      {stargazers ?? "-"}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Box>
                            </a>
                          );
                        })}
                    </AccordionDetails>
                  </Accordion>
                ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
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
