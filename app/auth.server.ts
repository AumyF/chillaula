import { WebAuthnStrategy } from "remix-auth-webauthn";
import { Authenticator } from "remix-auth";
import { sessionStorage } from "./auth/session.server";
import { Kysely } from "kysely";
import { DB } from "./db/generated/types";

type User = { id: number; username: string };

const getAuthenticators = async (db: Kysely<DB>, user: User | null) => {
  if (!user) return [];
  return await db
    .selectFrom("Authenticator")
    .selectAll()
    .where("id", "=", user.id)
    .execute();
};

const getUserByUsername = async (db: Kysely<DB>, username: string) => {
  return await db
    .selectFrom("User")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();
};

const getAuthenticatorById = async (db: Kysely<DB>, id: string) => {
  return await db
    .selectFrom("Authenticator")
    .selectAll()
    .where("credentialID", "=", id)
    .executeTakeFirst();
};

const createUser = async (
  db: Kysely<DB>,
  username: string,
  invitationId: number,
) => {
  const result = await db
    .insertInto("User")
    .values({ username, invitationId })
    .executeTakeFirst();
  return result.insertId ? { id: Number(result.insertId), username } : null;
};

const getUserById = async (db: Kysely<DB>, userId: number) => {
  return await db
    .selectFrom("User")
    .selectAll()
    .where("id", "=", userId)
    .executeTakeFirstOrThrow();
};

const createAuthenticator = async (
  db: Kysely<DB>,
  authenticator: {
    credentialID: string;
    credentialPublicKey: string;
    counter: number;
    credentialDeviceType: string;
    credentialBackedUp: number;
    transports: string;
  },
  userId: number,
) => {
  db.insertInto("Authenticator")
    .values({
      credentialID: authenticator.credentialID,
      userId,
      credentialPublicKey: authenticator.credentialPublicKey,
      counter: authenticator.counter,
      credentialBackedUp: authenticator.credentialBackedUp,
      credentialDeviceType: authenticator.credentialDeviceType,
      transports: authenticator.transports,
    })
    .executeTakeFirstOrThrow();
};

export const getAuthenticator = (db: Kysely<DB>) => {
  const authenticator = new Authenticator<User>(sessionStorage);

  const webAuthnStrategy = new WebAuthnStrategy<User>(
    {
      rpName: "Chillaula",
      rpID: (request) => new URL(request.url).hostname,
      origin: (request) => new URL(request.url).origin,
      getUserAuthenticators: async (user) => {
        const authenticators = await getAuthenticators(db, user);

        return authenticators.map((authenticator) => ({
          ...authenticator,
          transports: authenticator.transports.split(","),
        }));
      },
      getUserDetails: (user) =>
        user ? { id: user.id.toString(), username: user.username } : null,
      getUserByUsername: async (username) => {
        const user = await getUserByUsername(db, username);
        return user ?? null;
      },
      getAuthenticatorById: async (id) => {
        const authenticator = await getAuthenticatorById(db, id);
        return authenticator
          ? { ...authenticator, userId: authenticator.userId.toString() }
          : null;
      },
    },
    async function verify({ authenticator, type, username }) {
      let user: User | null = null;

      const savedAuthenticator = await getAuthenticatorById(
        db,
        authenticator.credentialID,
      );

      switch (type) {
        case "registration": {
          // 既存のユーザー(たった今作られたものも含む)にpasskeyを登録
          if (savedAuthenticator) {
            throw new Error("This authenticator has already been registered");
          }

          if (!username) throw new Error("Username is required");
          user = (await getUserByUsername(db, username)) ?? null;

          // たぶんふまないはず
          if (!user) throw new Error("User not found");

          await createAuthenticator(db, authenticator, user.id);
          break;
        }
        case "authentication": {
          if (!savedAuthenticator)
            throw new Error("Authenticator not registered");

          user = await getUserById(db, savedAuthenticator.userId);
          break;
        }
      }

      if (!user) throw new Error("User not found");

      return user;
    },
  );

  authenticator.use(webAuthnStrategy);

  return { authenticator, webAuthnStrategy };
};
