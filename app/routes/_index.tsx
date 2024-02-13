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
import { ResuRepo } from "~/resus/infra";
import { UserRepo } from "~/user/infra";
import { AuthenticatorRepo } from "~/authenticator/infra";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const repo = new ResuRepo(context.db);
  return json(await repo.fetchLatest());
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { authenticator } = getAuthenticator({
    userRepo: new UserRepo(context.db),
    authRepo: new AuthenticatorRepo(context.db),
  });
  const parseResult = await parseResu(authenticator, request);

  if (parseResult._type === "error") {
    return json({ error: parseResult.error });
  }

  const repo = new ResuRepo(context.db);

  await createResu(repo, {
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
          {({ id, content, createdAt, authorName, threadTitle, threadId }) => (
            <li key={id}>
              <ResuView
                {...{
                  content,
                  createdAt,
                  username: authorName,
                  threadTitle,
                  threadId,
                }}
              />
            </li>
          )}
        </List>
      </ResuList>
    </main>
  );
}
