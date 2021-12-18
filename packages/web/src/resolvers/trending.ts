import path from "path";
import { UserInputError } from "apollo-server-micro";
import { parseFile } from "@fast-csv/parse";
import { QueryResolvers } from "../generated/graphql";

const ROOT = path.join(__dirname, "../../../../archive");

export const trending: QueryResolvers["trending"] = async (_, args) => {
  const d = new Date(args.date);
  if (isNaN(d.getTime())) {
    throw new UserInputError("Invalid date");
  }

  const filepath = path.join(
    ROOT,
    [d.getFullYear(), d.getMonth() + 1, d.getDate()]
      .map((p) => String(p).padStart(2, "0"))
      .join("-"),
    args.language + ".csv"
  );

  const nodes = await new Promise<any[]>((resolve, reject) => {
    const rows: any[] = [];
    parseFile(filepath, { objectMode: true, headers: true })
      .on("data", (row) => {
        rows.push(row);
      })
      .on("error", reject)
      .on("end", () => resolve(rows));
  });

  return {
    repositories: {
      totalCount: nodes.length,
      edges: nodes.map((node) => ({ node })),
    },
  };
};
