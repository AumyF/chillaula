import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { FC, PropsWithChildren } from "react";
import { authenticator } from "~/auth.server";
import { Button } from "~/components/button";
import { db } from "~/kysely";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const List = <T,>(props: {
  list: readonly T[];
  children: (item: T, index: number) => React.ReactNode;
  fallback: () => React.ReactNode;
}) =>
  props.list.length > 0 ? props.list.map(props.children) : props.fallback();

const ResuList: FC<PropsWithChildren> = ({ children }) => {
  return <ul className="flex flex-col gap-4">{children}</ul>;
};

export const loader = async () => {
  return json(
    await db
      .selectFrom("Resu")
      .innerJoin("User", "User.id", "Resu.authorId")
      .select(["Resu.id", "Resu.content", "Resu.createdAt", "User.username"])
      .orderBy("Resu.createdAt desc")
      .execute(),
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
  } catch (e) {}
  const user = await authenticator.isAuthenticated(request);
  const formData = await request.formData();
  const content = formData.get("content")?.toString();
  if (!content) {
    return json({ error: "content empty" });
  }
  if (!user) {
    return json({ error: "login required" });
  }
  const result = await db
    .insertInto("Resu")
    .values({ content, authorId: user?.id })
    .executeTakeFirst();

  return json({ error: null });
};

const ResuComposer: FC = () => {
  return (
    <Form
      method="POST"
      className="flex flex-col gap-4 align-center justify-center"
    >
      <label className="flex flex-col">
        <span className="uppercase text-gray-600">Content</span>
        <textarea
          name="content"
          className="border border-zinc-300 rounded p-1"
        ></textarea>
      </label>
      <Button type="submit" className="ml-auto">
        Resu!
      </Button>
    </Form>
  );
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <header className="flex gap-4 items-baseline">
        <h1 className="font-bold text-4xl">Chillaula</h1>

        <Link to="/login">Sign in / Sign up</Link>
      </header>
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
              <article>
                <div className="flex text-sm">
                  <div>{username}</div>

                  <div className="flex-grow"></div>
                  <time>{createdAt}</time>
                </div>
                <div>{content}</div>
              </article>
            </li>
          )}
        </List>
      </ResuList>
    </div>
  );
}
