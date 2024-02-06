import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
} from "@remix-run/cloudflare";
import { useActionData, useLoaderData } from "@remix-run/react";
import { List } from "~/components/List";
import { ResuList } from "~/resus/list";
import { ResuView } from "~/resus/view";
import { parseResu } from "~/resus/parseFromRequest";
import { createResu } from "~/resus/create";
import { ResuComposer } from "~/resus/composer";
import { getAuthenticator } from "~/auth.server";
import { PageHeading } from "~/components/page-heading";
import { ResuRepo } from "~/resus/infra";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const { authenticator } = getAuthenticator(context.db);

  const id = Number.parseInt(params["id"] ?? "whoahaaaa");
  if (Number.isNaN(id)) {
    return json({ error: "Not found" }, 404);
  }
  const parseResult = await parseResu(authenticator, request);

  if (parseResult._type === "error") {
    return json({ error: parseResult.error });
  }

  const repo = new ResuRepo(context.db);

  await createResu(repo, {
    content: parseResult.content,
    authorId: parseResult.user.id,
    threadId: id,
  });

  return json({ error: null });
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const id = Number.parseInt(params["id"] ?? "whoahaaaa");
  if (Number.isNaN(id)) {
    return json({ error: "Not found" }, 404);
  }
  const bookmark = await context.db
    .selectFrom("Thread")
    .select(["Thread.id", "Thread.title"])
    .where("Thread.id", "=", id)
    .executeTakeFirst();

  if (!bookmark) {
    return json({ error: `bookmark with id ${id} not found` }, 404);
  }

  const resus = await context.db
    .selectFrom("Resu")
    .innerJoin("User", "User.id", "Resu.authorId")
    .select([
      "Resu.id",
      "User.username as username",
      "content",
      "Resu.createdAt",
    ])
    .where("Resu.threadId", "=", bookmark?.id)
    .orderBy("Resu.createdAt asc")
    .execute();

  return json({ bookmark: { ...bookmark, resus }, error: null });
}

export default function ThreadPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!loaderData || loaderData.error != null) {
    return <div>{loaderData.error}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-4 rounded-2xl backdrop-blur flex flex-col gap-2">
        <PageHeading>{loaderData.bookmark.title}</PageHeading>
      </div>

      <ResuList>
        <List
          list={loaderData.bookmark.resus}
          fallback={() => <div>まだレスがありません</div>}
        >
          {({ id, content, createdAt, username }) => (
            <li key={id}>
              <ResuView {...{ content, createdAt, username }} />
            </li>
          )}
        </List>
      </ResuList>
      <ResuComposer />
      {actionData?.error && (
        <div className="p-4 rounded-md bg-red-200 border border-red-500 text-red-900">
          {actionData.error}
        </div>
      )}
    </div>
  );
}
