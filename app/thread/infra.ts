import { Kysely } from "kysely";
import { IThreadRepo, Thread } from "./domain";
import { DB } from "~/db/generated/types";
import { typesafeJsonObjectFrom } from "~/utils/kysely-json";
import { temporalify, temporalifyForJSON } from "~/utils/temporal";

export class ThreadRepo implements IThreadRepo {
  #db;
  constructor(db: Kysely<DB>) {
    this.#db = db;
  }
  async save(thread: Thread) {
    await this.#db
      .insertInto("Thread")
      .values({
        title: thread.title,
        authorId: thread.author.id,
        id: thread.id,
        createdAt: new Date(thread.createdAt.toString()),
      })
      .executeTakeFirstOrThrow();
  }
  async queryById(id: number): Promise<Thread> {
    const result = await this.#db
      .selectFrom("Thread")
      .select(({ selectFrom }) => [
        "id",
        "title",
        "createdAt",
        typesafeJsonObjectFrom(
          selectFrom("User")
            .select(["id", "username", "createdAt", "invitationId"])
            .whereRef("id", "=", "Thread.authorId"),
        ).as("author"),
      ])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    if (result.author == null) {
      // TODO user 削除で踏みそう
      throw new Error("author null");
    }

    return temporalify({
      ...result,
      author: temporalifyForJSON(result.author),
    });
  }
}
