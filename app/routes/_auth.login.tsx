import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { ButtonHTMLAttributes } from "react";
import { handleFormSubmit } from "remix-auth-webauthn/build/handleFormSubmit.js";
import { authenticator, webAuthnStrategy } from "~/auth.server";
import { sessionStorage } from "~/auth/session.server";
import { Button } from "~/components/button";
import { db } from "~/kysely";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await authenticator.isAuthenticated(request);

  return webAuthnStrategy.generateOptions(request, sessionStorage, user);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const request2 = request.clone();
    const user = await authenticator.isAuthenticated(
      await sessionStorage.getSession(request.headers.get("Cookie")),
    );

    if (user) {
      throw new Error("Already logged in");
    }

    const formData = await request.formData();

    if (formData.get("type") === "registration") {
      // sign up

      const username = formData.get("username")?.toString();
      if (!username) {
        throw new Error("Username required");
      }

      // invite codeが必要
      const code = formData.get("code")?.toString();
      if (!code) {
        throw new Error("Invitation code required");
      }

      // invite codeの存在チェック
      const invitation = await db
        .selectFrom("Invitation")
        .selectAll()
        .where("code", "=", code)
        .executeTakeFirst();

      if (!invitation) {
        throw new Error("Invitation code invalid");
      }

      // invite codeが未使用かチェック
      const invitedUser = await db
        .selectFrom("User")
        .selectAll()
        .where("User.invitationId", "=", invitation.id)
        .executeTakeFirst();

      if (invitedUser) {
        throw new Error("Invitation code already used");
      }

      // ユーザーを作る
      await db
        .insertInto("User")
        .values({ username, invitationId: invitation.id })
        .executeTakeFirst();

      await authenticator.authenticate("webauthn", request2, {
        successRedirect: "/",
      });
    } else if (formData.get("type") === "authentication") {
      // sign in

      await authenticator.authenticate("webauthn", request2, {
        successRedirect: "/",
      });
    }

    return { error: null };
  } catch (error) {
    if (error instanceof Response && error.status >= 400) {
      return { error: (await error.json()) as { message: string } };
    }
    throw error;
  }
};



export default function Login() {
  const options = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main className="max-w-xl mx-auto">
      {options.user ? (
        <div>
          <div>{options.user.username}でログインしています</div>
          <Link to="/account_settings">アカウント設定</Link>
        </div>
      ) : (
        <Form
          className="flex flex-col gap-4 items-center justify-center"
          onSubmit={handleFormSubmit(options)}
          method="POST"
        >
          <label className="flex flex-col gap-1">
            <span>Username</span>
            <input
              className="border border-zinc-300"
              type="text"
              name="username"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Invitation Code</span>
            <input className="border border-zinc-300" type="text" name="code" />
          </label>

          <Button formMethod="GET">Check Username</Button>
          <div className="flex gap-4">
            <Button
              name="intent"
              value="registration"
              disabled={!options.usernameAvailable}
            >
              Sign up
            </Button>
            <Button name="intent" value="authentication">
              Sign in
            </Button>
          </div>
          {actionData?.error ? <div>{actionData.error.message}</div> : null}
        </Form>
      )}
    </main>
  );
}
