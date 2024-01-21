import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Outlet } from "@remix-run/react";
import { getAuthenticator } from "~/auth.server";
import { sessionStorage } from "~/auth/session.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const { authenticator, webAuthnStrategy } = getAuthenticator(context.db);
  const user = await authenticator.isAuthenticated(request);

  return webAuthnStrategy.generateOptions(request, sessionStorage, user);
};

export default function Auth() {
  return (
    <main className="max-w-4xl mx-auto">
      <Outlet />
    </main>
  );
}
