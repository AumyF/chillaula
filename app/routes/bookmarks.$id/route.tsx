import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
} from "@remix-run/cloudflare";
import { useActionData, useLoaderData } from "@remix-run/react";
import { List } from "~/components/List";
import { ResuList } from "~/resus/list";
import { ResuView } from "~/resus/view";
import { parseHTML } from "linkedom/worker";
import { parseResu } from "~/resus/parseFromRequest";
import { createResu } from "~/resus/create";
import { ResuComposer } from "~/resus/composer";
import { getAuthenticator } from "~/auth.server";
import { PageHeading } from "~/components/page-heading";

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
    .select([
      "Resu.id",
      "User.username as username",
      "content",
      "Resu.createdAt",
    ])
    .where("Resu.collectionId", "=", bookmark?.collectionId)
    .orderBy("Resu.createdAt asc")
    .execute();

  const pageData = bookmark.title
    ? undefined
    : await fetch(bookmark.url)
      .then((res) => res.text())
      .then((text) => {
        const html = parseHTML(text);
        const title = html.document.querySelector("title")?.innerText;
        const image = html.document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content");

        return { image, title };
      });

  return json({ pageData, bookmark: { ...bookmark, resus }, error: null });
}

export default function BookmarkPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!loaderData || loaderData.error != null) {
    return <div>{loaderData.error}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-4 rounded-2xl backdrop-blur flex flex-col gap-2">
        <PageHeading>
          {loaderData.bookmark.title || loaderData.bookmark.url}
        </PageHeading>
{loaderData.pageData?.title && (
        <div>fetched title: {loaderData.pageData.title}</div>
      )}
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
