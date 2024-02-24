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
import { createResu, createResuOnThread } from "~/resus/create";
import { ResuComposer } from "~/resus/composer";
import { getAuthenticator } from "~/auth.server";
import { PageHeading } from "~/components/page-heading";
import { ResuRepo } from "~/resus/infra";
import { UserRepo } from "~/user/infra";
import { AuthenticatorRepo } from "~/authenticator/infra";
import { ThreadRepo } from "~/thread/infra";
import Markdown from "react-markdown";

export async function action({ request, params, context }: ActionFunctionArgs) {
  try {
    const { authenticator } = getAuthenticator({
      userRepo: new UserRepo(context.db),
      authRepo: new AuthenticatorRepo(context.db),
    });

    const id = Number.parseInt(params["id"] ?? "whoahaaaa");
    if (Number.isNaN(id)) {
      return json({ error: "Not found" }, 404);
    }

    const user = await authenticator.isAuthenticated(request);
    if (!user) {
      return json({ _type: "error" as const, error: "login required" });
    }

    const fd = await request.formData();
    const content = fd.get("content")?.toString();
    if (!content) {
      return json({ _type: "error" as const, error: "content empty" });
    }

    const threadRepo = new ThreadRepo(context.db);

    const thread = await threadRepo.queryById(id);

    const repo = new ResuRepo(context.db);

    await createResuOnThread(repo, user, { content }, thread);
  } catch (e) {
    return json({ error: JSON.stringify(e) });
  }
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
              <ResuView
                {...{
                  content: (
                    <Markdown
                      components={{
                        ul: (props) => (
                          <ul {...props} className="list-disc pl-6"></ul>
                        ),
                        ol: (props) => (
                          <ol {...props} className="list-decimal pl-6"></ol>
                        ),
                      }}
                    >
                      {content}
                    </Markdown>
                  ),
                  createdAt,
                  username,
                }}
              />
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
