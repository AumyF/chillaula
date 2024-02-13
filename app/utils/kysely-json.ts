import { Expression, RawBuilder, Simplify } from "kysely";
import { jsonObjectFrom,jsonArrayFrom } from "kysely/helpers/mysql";

export type CastDatesToStrings<O> = {
  [K in keyof O]: O[K] extends Date ? string : O[K];
};

// https://github.com/kysely-org/kysely/issues/482
export function typesafeJsonArrayFrom<O>(
  expr: Expression<O>,
): RawBuilder<CastDatesToStrings<Simplify<O>>[]> {
  // @ts-expect-error #TS2322
  return jsonArrayFrom(expr);
}

export function typesafeJsonObjectFrom<O>(expr: Expression<O>) : RawBuilder<CastDatesToStrings<Simplify<O>>|null> {
  // @ts-expect-error #TS2322
  return jsonObjectFrom(expr)
}
