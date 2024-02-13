import { Temporal, toTemporalInstant } from "@js-temporal/polyfill";

export const temporalify = <T extends { createdAt: Date }>(
  a: T,
): Omit<T, "createdAt"> & { createdAt: Temporal.Instant } => {
  return {
    ...a,
    createdAt: toTemporalInstant.call(a.createdAt),
  };
};

export const temporalifyForJSON = <T extends { createdAt: string }>(
  a: T,
): Omit<T, "createdAt"> & { createdAt: Temporal.Instant } => {
  return {
    ...a,
    createdAt: Temporal.Instant.from(a.createdAt.replace(" ", "T") + "Z"), // 本当にUTCですか？
  };
};
