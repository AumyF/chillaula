import { Kysely } from "kysely";
import { IInvitationRepo, Invitation } from "./domain";
import { DB } from "~/db/generated/types";
import { toTemporalInstant } from "@js-temporal/polyfill";

export class InvitationRepo implements IInvitationRepo {
  #db;
  constructor(db: Kysely<DB>) {
    this.#db = db;
  }

  async isValid(invitation: Invitation): Promise<boolean> {
    const user = await this.#db
      .selectFrom("User")
      .select(["id"])
      .where("invitationId", "=", invitation.id)
      .executeTakeFirst();

    return !user;
  }

  async query(code: string): Promise<Invitation> {
    const result = await this.#db
      .selectFrom("Invitation")
      .select(["id", "code", "createdAt"])
      .where("code", "=", code)
      .executeTakeFirstOrThrow();

    return { ...result, createdAt: toTemporalInstant.call(result.createdAt) };
  }
}
