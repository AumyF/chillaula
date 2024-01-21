import { Kysely } from "kysely";
import { DB } from "~/db/generated/types";

export const createResu = async (
  db: Kysely<DB>,
  {
    content,
    authorId,
    collectionId,
  }: {
    content: string;
    authorId: number;
    collectionId?: number;
  },
) => {
  await db
    .insertInto("Resu")
    .values({ content, authorId, collectionId })
    .executeTakeFirst();
};
