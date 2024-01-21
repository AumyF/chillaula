import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
} from "@remix-run/cloudflare";
import { useActionData, useLoaderData } from "@remix-run/react";
import { List } from "~/components/List";
import { ResuList } from "~/components/ResuList";
import { ResuView } from "~/components/ResuView";
import { parseHTML } from "linkedom/worker";
import { parseResu } from "~/resus/parseFromRequest";
import { createResu } from "~/resus/create";
import { ResuComposer } from "~/resus/composer";
import { getAuthenticator } from "~/auth.server";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const { authenticator } = getAuthenticator(context.db);

  const id = Number.parseInt(params["id"] ?? "whoahaaaa");
  if (Number.isNaN(id)) {
    return json({ error: "Not found" }, 404);
  }

  const bookmark = await context.db
    .selectFrom("Bookmark")
    .select(["collectionId"])
    .where("id", "=", id)
    .executeTakeFirst();

  if (!bookmark) {
    return json({ error: "Not found" });
  }

  const parseResult = await parseResu(authenticator, request);

  if (parseResult._type === "error") {
    return json({ error: parseResult.error });
  }

  await createResu(context.db, {
    content: parseResult.content,
    authorId: parseResult.user.id,
    collectionId: bookmark.collectionId,
  });

  return json({ error: null });
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const id = Number.parseInt(params["id"] ?? "whoahaaaa");
  if (Number.isNaN(id)) {
    return json({ error: "Not found" }, 404);
  }
  const bookmark = await context.db
    .selectFrom("Bookmark")
    .innerJoin("ResuCollection", "ResuCollection.id", "Bookmark.collectionId")
    .select([
      "Bookmark.id",
      "Bookmark.collectionId",
      "Bookmark.title",
      "Bookmark.url",
    ])
    .where("Bookmark.id", "=", id)
    .executeTakeFirst();

  if (!bookmark) {
    return json({ error: `bookmark with id ${id} not found` }, 404);
  }

  const resus = await context.db
    .selectFrom("Resu")
    .innerJoin("User", "User.id", "Resu.authorId")
    .selectAll()
    .where("Resu.collectionId", "=", bookmark?.collectionId)
    .orderBy("Resu.createdAt asc")
    .execute();

  const fetchedTitle = bookmark.title
    ? undefined
    : await fetch(bookmark.url)
        .then((response) => response.text())
        .then((text) => {
          const html = parseHTML(text);
          return html.document.querySelector("title")?.innerText;
        });

  return json({ fetchedTitle, bookmark: { ...bookmark, resus }, error: null });
}

export default function BookmarkPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!loaderData || loaderData.error != null) {
    return <div>{loaderData.error}</div>;
  }

  return (
    <div>
      <h1>{loaderData.bookmark.title}</h1>
      {loaderData.fetchedTitle && (
        <div>fetched title: {loaderData.fetchedTitle}</div>
      )}
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
