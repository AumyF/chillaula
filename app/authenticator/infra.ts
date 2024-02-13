import { Kysely } from "kysely";
import { Authenticator, IRepo } from "./domain";
import { DB } from "~/db/generated/types";
import { Temporal, toTemporalInstant } from "@js-temporal/polyfill";
import { UserRepo } from "~/user/infra";
import * as User from "~/user/domain";
import { typesafeJsonObjectFrom } from "~/utils/kysely-json";

const temporalify = <T extends { createdAt: Date }>(
  a: T,
): Omit<T, "createdAt"> & { createdAt: Temporal.Instant } => {
  return {
    ...a,
    createdAt: toTemporalInstant.call(a.createdAt),
  };
};

const temporalifyForJSON = <T extends {createdAt: string}>(a : T) : Omit<T, "createdAt"> & {createdAt: Temporal.Instant}=> {
  return {
    ...a,
    createdAt: Temporal.Instant.from(a.createdAt.replace(" ", "T") + "Z") // 本当にUTCですか？
  }
}

export class AuthenticatorRepo implements IRepo {
  #db;
  constructor(db: Kysely<DB>) {
    this.#db = db;
  }

  async save(authenticator: Authenticator): Promise<void> {
    await this.#db
      .insertInto("Authenticator")
      .values({
        credentialID: authenticator.credentialID,
        userId: authenticator.user.id,
        credentialPublicKey: authenticator.credentialPublicKey,
        counter: authenticator.counter,
        credentialBackedUp: Number(authenticator.credentialBackedUp),
        credentialDeviceType: authenticator.credentialDeviceType,
        transports: authenticator.transports,
      })
      .executeTakeFirstOrThrow();
  }

  async queryById(id: number): Promise<Authenticator> {
    const au = await this.#db
      .selectFrom("Authenticator")
      .select([
        "id",
        "createdAt",
        "userId",
        "credentialID",
        "credentialPublicKey",
        "credentialBackedUp",
        "credentialDeviceType",
        "counter",
        "transports",
      ])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
    const auth = temporalify(au);

    const userRepo = new UserRepo(this.#db);
    const user = await userRepo.queryById(auth.userId);

    return {
      ...auth,
      user,
      credentialBackedUp: Boolean(auth.credentialBackedUp),
    };
  }

  async queryManyByUser(user: User.User) {
    const auths = await this.#db
      .selectFrom("Authenticator")
      .select(({ selectFrom }) => [
        "Authenticator.id",
        "Authenticator.createdAt",
        "credentialID",
        "credentialPublicKey",
        "credentialBackedUp",
        "credentialDeviceType",
        "counter",
        "userId",
        "transports",
        typesafeJsonObjectFrom(
          selectFrom("User")
            .select(["id", "username", "invitationId", "createdAt"])
            .whereRef("id", "=", "Authenticator.userId"),
        ).as("user"),
      ])
      .where("userId", "=", user.id)
      .execute();

    return auths.map((a) => {
      if (a.user === null) {
        throw new TypeError(
          `authenticator ${a.id} has userId ${a.userId} but such user does not exist`,
        );
      }
      console.log({ user:a.user });
      return temporalify({
        ...a,
        credentialBackedUp: Boolean(a.credentialBackedUp),
        user: temporalifyForJSON(a.user),
      });
    });
  }

  async queryByCredentialId(credentialId: string) {
    const auths = await this.#db
      .selectFrom("Authenticator")
      .select(({ selectFrom }) => [
        "Authenticator.id",
        "Authenticator.createdAt",
        "credentialID",
        "credentialPublicKey",
        "credentialBackedUp",
        "credentialDeviceType",
        "counter",
        "userId",
        "transports",
        typesafeJsonObjectFrom(
          selectFrom("User")
            .select(["id", "username", "invitationId", "createdAt"])
            .whereRef("id", "=", "Authenticator.userId"),
        ).as("user"),
      ])
      .where("credentialID", "=", credentialId)
      .executeTakeFirstOrThrow();

    if (auths.user === null) {
      throw new TypeError(
        `authenticator ${auths.id} has userId ${auths.userId} but such user does not exist`,
      );
    }
    return temporalify({
      ...auths,
      user: temporalifyForJSON(auths.user),
      credentialBackedUp: Boolean(auths.credentialBackedUp),
    });
  }
}
