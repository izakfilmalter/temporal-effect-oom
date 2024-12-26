import { Schema } from 'effect'

export const APICollection = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      type: Schema.String,
      attributes: Schema.Unknown,
    }),
  ),
  meta: Schema.Struct({
    total_count: Schema.Number,
    count: Schema.Number,
    next: Schema.optional(
      Schema.Struct({
        offset: Schema.Number,
      }),
    ),
  }),
})
export type APICollection = Schema.Schema.Type<typeof APICollection>
