import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { useActionData, useLoaderData } from "@remix-run/react";
import { getAuthenticator } from "~/auth.server";
import { List } from "~/components/List";
import { ResuList } from "~/resus/list";
import { ResuView } from "~/resus/view";
import { ResuComposer } from "~/resus/composer";
import { createResu } from "~/resus/create";
import { parseResu } from "~/resus/parseFromRequest";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  return json(
    await context.db
      .selectFrom("Resu")
      .innerJoin("User", "User.id", "Resu.authorId")
      .select(["Resu.id", "Resu.content", "Resu.createdAt", "User.username"])
      .orderBy("Resu.createdAt desc")
      .execute(),
  );
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { authenticator } = getAuthenticator(context.db);
  const parseResult = await parseResu(authenticator, request);

  if (parseResult._type === "error") {
    return json({ error: parseResult.error });
  }

  createResu(context.db, {
    content: parseResult.content,

    authorId: parseResult.user.id,
  });

  return json({ error: null });
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main>
      {actionData?.error && (
        <div className="p-4 rounded-md bg-red-200 border border-red-500 text-red-900">
          {actionData.error}
        </div>
      )}
      <ResuComposer></ResuComposer>
      <ResuList>
        <List list={data} fallback={() => <div>まだレスがありません</div>}>
          {({ id, content, createdAt, username }) => (
            <li key={id}>
              <ResuView {...{ content, createdAt, username }} />
            </li>
          )}
        </List>
      </ResuList>
    </main>
  );
}
