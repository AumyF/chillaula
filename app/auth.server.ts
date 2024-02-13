import { WebAuthnStrategy } from "remix-auth-webauthn";
import { Authenticator } from "remix-auth";
import { sessionStorage } from "./auth/session.server";
import { UserRepo } from "./user/infra";
import { AuthenticatorRepo } from "./authenticator/infra";
import * as Authen from "~/authenticator/domain";
import { User } from "~/user/domain";

export const getAuthenticator = ({
  userRepo, authRepo,
}: {
  userRepo: UserRepo;
  authRepo: AuthenticatorRepo;
}) => {
  const authenticator = new Authenticator<User>(sessionStorage);

  const webAuthnStrategy = new WebAuthnStrategy<User>(
    {
      rpName: "Chillaula",
      rpID: (request) => new URL(request.url).hostname,
      origin: (request) => new URL(request.url).origin,
      getUserAuthenticators: async (user) => {
        if (user == null) return [];
        const authenticators = await authRepo.queryManyByUser(user);

        return authenticators.map((authenticator) => ({
          ...authenticator,
          transports: authenticator.transports.split(","),
        }));
      },
      getUserDetails: (user) =>
        user ? { id: user.id.toString(), username: user.username } : null,
      getUserByUsername: async (username) => {
        const user = await userRepo.queryByUsername(username);
        return user ?? null;
      },
      getAuthenticatorById: async (id) => {
        const authenticator = await authRepo.queryByCredentialId(id);
        return authenticator
          ? {
            ...authenticator,
            userId: authenticator.user.id.toString(),
            credentialBackedUp: Number(authenticator.credentialBackedUp),
          }
          : null;
      },
    },
    async function verify({ authenticator, type, username }) {
      let user: User | null = null;

      const savedAuthenticator = await authRepo.queryByCredentialId(
        authenticator.credentialID,
      );

      switch (type) {
        case "registration": {
          // 既存のユーザー(たった今作られたものも含む)にpasskeyを登録
          if (savedAuthenticator) {
            throw new Error("This authenticator has already been registered");
          }

          if (!username) throw new Error("Username is required");
          user = (await userRepo.queryByUsername(username)) ?? null;

          // たぶんふまないはず
          if (!user) throw new Error("User not found");

          authRepo.save(
            Authen.make({
              ...authenticator,
              user,
              credentialBackedUp: Boolean(authenticator.credentialBackedUp),
            }),
          );
          break;
        }
        case "authentication": {
          if (!savedAuthenticator)
            throw new Error("Authenticator not registered");

          user = await userRepo.queryById(savedAuthenticator.userId);
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
