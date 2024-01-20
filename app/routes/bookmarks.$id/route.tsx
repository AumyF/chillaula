import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { List } from "~/components/List";
import { ResuList } from "~/components/ResuList";
import { ResuView } from "~/components/ResuView";
import { db } from "~/kysely";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = Number.parseInt(params["id"] ?? "whoahaaaa");
  if (Number.isNaN(id)) {
    return json({ error: "Not found" }, 404);
  }
  const bookmark = await db
    .selectFrom("Bookmark")
    .innerJoin("ResuCollection", "ResuCollection.id", "Bookmark.collectionId")
    .select(["Bookmark.id", "Bookmark.collectionId"])
    .where("Bookmark.id", "=", id)
    .executeTakeFirst();

  if (!bookmark) {
    return json({ error: `bookmark with id ${id} not found` }, 404);
  }

  const resus = await db
    .selectFrom("Resu")
    .innerJoin("User", "User.id", "Resu.authorId")
    .selectAll()
    .where("Resu.collectionId", "=", bookmark?.collectionId)
    .execute();

  return json({ bookmark: { ...bookmark, resus }, error: null });
}

export default function BookmarkPage() {
  const bookmark = useLoaderData<typeof loader>();

  if (!bookmark || bookmark.error != null) {
    return <div>{bookmark.error}</div>;
  }

  return (
    <div>
      <ResuList>
        <List
          list={bookmark.bookmark.resus}
          fallback={() => <div>まだレスがありません</div>}
        >
          {({ id, content, createdAt, username }) => (
            <li key={id}>
              <ResuView {...{ content, createdAt, username }} />
            </li>
          )}
        </List>
      </ResuList>
    </div>
  );
}
