import { Form } from "@remix-run/react";
import { FC } from "react";
import { Button } from "~/components/button";

export const ResuComposer: FC = () => {
  return (
    <Form
      method="POST"
      className="flex flex-col gap-2 align-center justify-center"
    >
      <label className="flex flex-col">
        <span className="uppercase text-gray-600">Content</span>
        <textarea
          name="content"
          className="border border-slate-300 rounded-2xl p-4"
        ></textarea>
      </label>
      <Button type="submit" className="ml-auto">
        Resu!
      </Button>
    </Form>
  );
};
