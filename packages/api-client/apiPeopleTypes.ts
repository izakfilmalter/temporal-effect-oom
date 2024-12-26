import { Schema } from 'effect'

import { APICollection } from './apiTypes'

export const Person = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal('person'),
  attributes: Schema.Struct({
    first_name: Schema.String,
    last_name: Schema.String,
  }),
})
export type Person = Schema.Schema.Type<typeof Person>

export const GetPeopleQuery = Schema.Struct({
  per_page: Schema.optional(Schema.Number),
  offset: Schema.optional(Schema.Number),
})
export type GetPeopleQuery = Schema.Schema.Type<typeof GetPeopleQuery>

export const GetPeopleResponse = Schema.Struct({
  ...APICollection.fields,
  data: Schema.Array(Person),
})
export type GetPeopleResponse = Schema.Schema.Type<typeof GetPeopleResponse>
