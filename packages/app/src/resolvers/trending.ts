import { UserInputError } from "apollo-server-micro";
import { QueryResolvers } from "../generated/graphql";
import { Repository } from "../entity";

export const trending: QueryResolvers["trending"] = async (_, args) => {
  if (isNaN(new Date(args.date).getTime())) {
    throw new UserInputError("Invalid date");
  }

  const nodes = await Repository.find({
    where: {
      date: args.date,
      language: args.language,
    },
  });

  return {
    repositories: {
      totalCount: nodes.length,
      edges: nodes.map((node) => ({ node })),
    },
  };
};
