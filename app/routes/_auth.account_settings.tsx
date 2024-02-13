import { LoaderFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { Form, useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { handleFormSubmit } from "remix-auth-webauthn/build/handleFormSubmit.js";
import { getAuthenticator } from "~/auth.server";
import type { loader as optionLoader } from "./_auth";
import { UserRepo } from "~/user/infra";
import { AuthenticatorRepo } from "~/authenticator/infra";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await getAuthenticator({
    userRepo: new UserRepo(context.db),
    authRepo: new AuthenticatorRepo(context.db),
  }).authenticator.isAuthenticated(request);

  if (!user) {
    return redirect("/login");
  }

  const userData = await context.db
    .selectFrom("User")
    .selectAll()
    .where("id", "=", user.id)
    .executeTakeFirst();

  const authenticators = await context.db
    .selectFrom("Authenticator")
    .select(["id", "createdAt"])
    .where("userId", "=", user.id)
    .orderBy("createdAt desc")
    .execute();

  if (!userData) {
    return redirect("/login");
  }

  return json({ authenticators });
}
export default function AccountSetings() {
  const loaderData = useLoaderData<typeof loader>();
  const options = useRouteLoaderData<typeof optionLoader>("routes/_auth");

  if (!options) {
    throw new Error("route loader error");
  }

  return (
    <div>
      <h1>アカウント設定</h1>
      <h2>パスキー一覧</h2>
      <ul>
        {loaderData.authenticators.map((a) => (
          <li key={a.id}>
            Created at <time>{a.createdAt}</time>
          </li>
        ))}
      </ul>
      <Form method="POST" onSubmit={handleFormSubmit(options)}></Form>
    </div>
  );
}
