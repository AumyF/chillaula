import { Kysely } from "kysely";
import { User, IUserRepo } from "./domain";
import { DB } from "~/db/generated/types";
import { toTemporalInstant } from "@js-temporal/polyfill";

export class UserRepo implements IUserRepo {
  #db;
  constructor(db: Kysely<DB>) {
    this.#db = db;
  }
  async save(user: User) {
    this.#db.insertInto("User").values({
      id: user.id,
      createdAt: new Date(user.createdAt.toString()),
      invitationId: user.invitationId,
      username: user.username,
    });
  }

  async queryById(id: number): Promise<User> {
    const result = await this.#db
      .selectFrom("User")
      .select(["id", "username", "createdAt", "invitationId"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    return {
      ...result,
      createdAt: toTemporalInstant.call(result.createdAt),
    };
  }

  async queryByUsername(username: string): Promise<User> {
    const result = await this.#db
      .selectFrom("User")
      .select(["id", "username", "createdAt", "invitationId"])
      .where("username", "=", username)
      .executeTakeFirstOrThrow();

    return { ...result, createdAt: toTemporalInstant.call(result.createdAt) };
  }
}
