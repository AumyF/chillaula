import { db } from "~/kysely";

export const createResu = async ({
  content,
  authorId,
  collectionId,
}: {
  content: string;
  authorId: number;
  collectionId?: number;
}) => {
  await db
    .insertInto("Resu")
    .values({ content, authorId, collectionId })
    .executeTakeFirst();
};
