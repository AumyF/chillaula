import { Form } from "@remix-run/react";
import { FC } from "react";
import { Button } from "~/components/button";

export const ResuComposer: FC = () => {
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
