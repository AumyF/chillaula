import { Kysely } from "kysely";
import { DB } from "~/db/generated/types";

export const createResu = async (
  db: Kysely<DB>,
  {
    content,
    authorId,
    threadId,
  }: {
    content: string;
    authorId: number;
    threadId?: number;
  },
) => {
  return await db
    .insertInto("Resu")
    .values({ content, authorId, threadId })
    .executeTakeFirst();
};
