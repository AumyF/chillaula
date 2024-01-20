import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
} from "@remix-run/react";

import styles from "./tailwind.css";
import { authenticator } from "./auth.server";
import { db } from "./kysely";
import { sessionStorage } from "./auth/session.server";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: styles },
];

export async function loader({ context, request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({ user: null });
  }
  const userData = await db
    .selectFrom("User")
    .selectAll()
    .where("id", "=", user.id)
    .executeTakeFirst();
  if (!userData) {
    // アカウントが消されたがセッションがまだ残っている
    // 開発では起きるかも
    const header = await sessionStorage.destroySession(
      await sessionStorage.getSession(),
    );

    return json({ user: null }, { headers: { "Set-Cookie": header } });
  }
  return json({ user: userData });
}

export default function App() {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="p-4">
          <div className="max-w-xl mx-auto flex flex-col gap-4">
            <header className="flex gap-4 items-baseline">
              <h1 className="font-bold text-4xl">Chillaula</h1>

              <Link to="/login">Sign in / Sign up</Link>
            </header>
            <div>
              <Link to="/bookmarks">Bookmarks</Link>
            </div>
            <Outlet />
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
