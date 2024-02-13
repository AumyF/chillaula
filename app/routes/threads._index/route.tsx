import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { getAuthenticator } from "~/auth.server";
import { AuthenticatorRepo } from "~/authenticator/infra";
import { List } from "~/components/List";
import { UserRepo } from "~/user/infra";

export async function loader({ context }: LoaderFunctionArgs) {
  const bookmarks = await context.db
    .selectFrom("Thread")
    .innerJoin("User", "User.id", "Thread.authorId")
    .select(["Thread.id", "Thread.title", "Thread.createdAt", "User.username"])
    .orderBy("Thread.createdAt desc")
    .execute();

  return json({ bookmarks });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { authenticator } = 
  getAuthenticator({
    userRepo: new UserRepo(context.db),
    authRepo: new AuthenticatorRepo(context.db),
  });
  const user = await authenticator.isAuthenticated(request);
  const formData = await request.formData();

  const title = formData.get("title")?.toString();
  if (!title) {
    return json({ error: "title empty" }, 400);
  }
  if (!user) {
    return json({ error: "login required" }, 400);
  }

  const result = await context.db
    .insertInto("Thread")
    .values({
      title,
      authorId: user.id,
    })
    .executeTakeFirstOrThrow();

  if (result.insertId === undefined) {
    throw new Error("Failed to insert");
  }

  return redirect(`/bookmarks/${result.insertId}`);
}

export default function Threads() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      <Form method="POST" className="flex items-end">
        <label className="flex-grow">
          <div className="text-slate-600 font-bold">Title</div>
          <input className="rounded-s-lg p-2 w-full" name="title" />
        </label>
        <button className="font-bold bg-blue-600 text-slate-50 rounded-e-lg p-2">
          Create Thread
        </button>
      </Form>
      <ul className="flex flex-col gap-2">
        <List fallback={() => <div></div>} list={data.bookmarks}>
          {({ id, title, username, createdAt }) => (
            <li key={id}>
              <article className="bg-white rounded-2xl p-4">
                <div className="flex text-sm">
                  <div>{username}</div>
                  <div className="flex-grow" />
                  <time>{createdAt}</time>
                </div>
                <div className="font-bold text-lg">
                  <Link to={`/threads/${id}`}>{title}</Link>
                </div>
              </article>
            </li>
          )}
        </List>
      </ul>
    </div>
  );
}
