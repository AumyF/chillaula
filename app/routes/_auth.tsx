import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { authenticator, webAuthnStrategy } from "~/auth.server";
import { sessionStorage } from "~/auth/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
