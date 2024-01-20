import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { authenticator } from "~/auth.server";
import { List } from "~/components/List";
import { db } from "~/kysely";

export async function loader() {
  const bookmarks = await db
    .selectFrom("Bookmark")
    .innerJoin("User", "User.id", "Bookmark.authorId")
    .select([
      "Bookmark.id",
      "Bookmark.url",
      "Bookmark.title",
      "Bookmark.createdAt",
      "User.username",
    ])
    .orderBy("Bookmark.createdAt desc")
    .execute();

  return json({ bookmarks });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);
  const formData = await request.formData();

  const url = formData.get("url")?.toString();
  if (!url) {
    return json({ error: "title empty" }, 400);
  }
  if (!user) {
    return json({ error: "login required" }, 400);
  }

  const result = await db.transaction().execute(async (db) => {
    const collection = await db
      .insertInto("ResuCollection")
      .values({})
      .executeTakeFirstOrThrow();

    if (collection.insertId === undefined) {
      throw new Error("failed to insert");
    }

    return await db
      .insertInto("Bookmark")
      .values({
        title: "",
        url,
        collectionId: Number(collection.insertId),
        authorId: user.id,
      })
      .executeTakeFirstOrThrow();
  });

  if (result.insertId === undefined) {
    throw new Error("Failed to insert");
  }

  return redirect(`/bookmarks/${result.insertId}`);
}

export default function Bookmarks() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <Form method="POST">
        <label>
          <div>URL</div>
          <input name="url" />
        </label>
        <button>Create Bookmark</button>
      </Form>
      <ul>
        <List fallback={() => <div></div>} list={data.bookmarks}>
          {({ id, url, title, username, createdAt }) => (
            <li key={id}>
              <article>
                <div className="flex text-sm">
                  <div>{username}</div>
                  <div className="flex-grow" />
                  <time>{createdAt}</time>
                </div>
                <div>
                  <a href={url}>{url}</a>
                </div>
                <div className="font-bold text-lg">
                  <Link to={`/bookmarks/${id}`}>{title || url}</Link>
                </div>
              </article>
            </li>
          )}
        </List>
      </ul>
    </div>
  );
}
