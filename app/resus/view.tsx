import { FC, ReactNode, useEffect, useState } from "react";
import "@formatjs/intl-durationformat/polyfill";
import { Temporal } from "@js-temporal/polyfill";

export type Props = {
  username: string;
  createdAt: string;
  content: ReactNode;
  threadId?: number | null;
  threadTitle?: string | null;
};

let isHydrating = true;

export const ResuView: FC<Props> = ({
  username,
  createdAt,
  content,
  threadId,
  threadTitle,
}) => {
  const [isHydrated, setIsHydrated] = useState(!isHydrating);

  useEffect(() => {
    isHydrating = false;
    setIsHydrated(true);
  }, []);
  const at = Temporal.Instant.from(createdAt).toZonedDateTimeISO(
    Temporal.Now.timeZoneId(),
  );
  return (
    <article className="rounded-2xl bg-white p-4">
      <div className="text-sm text-slate-600">
        <span className="font-bold">{username}</span>が
        <time>
          {isHydrated &&
            Temporal.Now.zonedDateTimeISO()
              .since(at, { smallestUnit: "minute" })
              .toLocaleString("ja-JP")}
        </time>
        に
        {threadId != null ? (
          <>
            <a
              className="underline underline-offset-2 decoration-1 hover:decoration-2"
              href={`/threads/${threadId}`}
            >
              {threadTitle}
            </a>
            に
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
