import { graphql, GraphqlResponseError } from "@octokit/graphql";
import { inRange } from "./date";

export function isNotFoundError(
  e: unknown
): e is GraphqlResponseError<unknown> {
  return (
    e instanceof GraphqlResponseError && e.errors?.[0].type === "NOT_FOUND"
  );
}

export function isRateLimitedError(
  e: unknown
): e is GraphqlResponseError<unknown> {
  return (
    e instanceof GraphqlResponseError && e.errors?.[0].type === "RATE_LIMITED"
  );
}

export async function getMetaInfo({
  owner,
  name,
  token,
}: {
  owner: string;
  name: string;
  token: string;
}) {
  const metaQuery = `
    query meta($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        createdAt
        description
        repositoryTopics(first: 100) {
          edges {
            node {
              topic {
                name
              }
            }
          }
        }
        stargazers {
          totalCount
        }
      }
    }
  `;
  const { repository } = await graphql<{
    repository: {
      createdAt: string;
      description: string;
      repositoryTopics: {
        edges: {
          node: {
            topic: {
              name: string;
            };
          };
        }[];
      };
      stargazers: {
        totalCount: number;
      };
    };
  }>(metaQuery, {
    owner,
    name,
    headers: { authorization: `token ${token}` },
  });
  return repository;
}

export async function getStarCountInThisRange({
  owner,
  name,
  token,
  since,
  until,
}: {
  owner: string;
  name: string;
  token: string;
  since: Date;
  until: Date;
}) {
  const stargazersQuery = `
    query stargazers($owner: String!, $name: String!, $after: String) {
      repository(owner: $owner, name: $name) {
        stargazers(first: 100, after: $after, orderBy: {field: STARRED_AT, direction: DESC}) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            starredAt
          }
        }
      }
    }
  `;

  let after: string | null = null;
  let starCountInThisRange = 0;
  while (1) {
    // @ts-expect-error TODO
    const { repository } = await graphql<{
      repository: {
        stargazers: {
          pageInfo: { hasNextPage: boolean; endCursor: string };
          edges: { starredAt: string }[];
        };
      };
    }>(stargazersQuery, {
      owner,
      name,
      after,
      headers: { authorization: `token ${token}` },
    });
    // @ts-expect-error TODO
    starCountInThisRange += repository.stargazers.edges.filter((e) =>
      inRange(new Date(e.starredAt), since, until)
    ).length;
    if (
      !repository.stargazers.pageInfo.hasNextPage ||
      repository.stargazers.edges.some(
        // @ts-expect-error TODO
        (e) => new Date(e.starredAt).getTime() < since.getTime()
      )
    ) {
      break;
    }
    after = repository.stargazers.pageInfo.endCursor;
  }
  return starCountInThisRange;
}
