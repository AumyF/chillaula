import { FC, ReactNode } from "react";

export type Props = {
  username: string;
  createdAt: string;
  content: ReactNode;
  threadId?: number | null;
  threadTitle?: string | null;
};

export const ResuView: FC<Props> = ({
  username,
  createdAt,
  content,
  threadId,
  threadTitle,
}) => {
  return (
    <article className="rounded-2xl bg-white p-4">
      <div className="text-sm text-slate-600">
        <span className="font-bold">{username}</span>が<time>{createdAt}</time>
        に
        {threadId != null ? (
          <>
            <a className="underline underline-offset-2 decoration-1 hover:decoration-2" href={`/threads/${threadId}`}>{threadTitle}</a>に
          </>
        ) : (
          ""
        )}
        レス
      </div>
      <div>{content}</div>
    </article>
  );
};
