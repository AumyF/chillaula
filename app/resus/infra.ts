import { DB } from "~/db/generated/types";
import { IResuRepo, Resu } from "./domain";
import { Kysely } from "kysely";
import { toTemporalInstant } from "@js-temporal/polyfill";

export class ResuRepo implements IResuRepo {
  #db;
  constructor(db: Kysely<DB>) {
    this.#db = db;
  }
  async save(resu: Resu) {
    await this.#db
      .insertInto("Resu")
      .values({
        id: resu.id,
        authorId: resu.authorId,
        content: resu.content,
        // MySQLはISO8601をそのままでは解釈できない(？？？)
        createdAt: new Date(resu.createdAt.toString()),
        threadId: resu.threadId,
      })
      .execute();
  }
  async fetchLatest() {
    const result = await this.#db
      .selectFrom("Resu")
      .innerJoin("User", "User.id", "Resu.authorId")
      .leftJoin("Thread", "Thread.id", "Resu.threadId")

      .select([
        "Resu.id",
        "Resu.content",
        "Resu.createdAt",
        "Resu.authorId",
        "User.username as authorName",
        "Thread.title as threadTitle",
        "Thread.id as threadId",
      ])
      .orderBy("Resu.createdAt desc")
      .execute();

    return result.map((result) => ({
      ...result,
      createdAt: toTemporalInstant.call(result.createdAt),
      threadId: result.threadId ?? undefined,
    }));
  }
  async fetchLatestOnThread({ id }: { id: number }) {
    const result = await this.#db
      .selectFrom("Resu")
      .innerJoin("User", "User.id", "Resu.authorId")
      .select([
        "Resu.id",
        "Resu.content",
        "Resu.createdAt",
        "Resu.authorId",
        "User.username as username",
      ])
      .where("Resu.threadId", "=", id)
      .orderBy("Resu.createdAt asc")
      .execute();

    return result.map((resu) => ({
      id: resu.id,
      createdAt: toTemporalInstant.call(resu.createdAt),
      content: resu.content,
      authorId: resu.authorId,
    }));
  }
}
