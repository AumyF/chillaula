import { FC, ReactNode } from "react";

export type Props = {
  username: string;
  createdAt: string;
  content: ReactNode;
};

export const ResuView: FC<Props> = ({ username, createdAt, content }) => {
  return (
    <article>
      <div className="flex text-sm">
        <div>{username}</div>

        <div className="flex-grow"></div>
        <time>{createdAt}</time>
      </div>
      <div>{content}</div>
    </article>
  );
};
