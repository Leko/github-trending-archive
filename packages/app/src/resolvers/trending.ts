import path from "path";
import { UserInputError } from "apollo-server-micro";
import { QueryResolvers } from "../generated/graphql";
import { load } from "../../data/loader";

const ROOT = path.join(process.cwd(), "..", "..", "archive", "raw");

export const trending: QueryResolvers["trending"] = async (_, args) => {
  const d = new Date(args.date);
  if (isNaN(d.getTime())) {
    throw new UserInputError("Invalid date");
  }

  const nodes = await load(d, args.language);

  return {
    repositories: {
      totalCount: nodes.length,
      edges: nodes.map((node) => ({ node })),
    },
  };
};
