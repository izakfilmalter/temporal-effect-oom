import { Schema } from 'effect'

import { APICollection } from './apiTypes'

export const Person = Schema.Struct({
  id: Schema.String,
})
export type Person = Schema.Schema.Type<typeof Person>

export const GetPeopleQuery = Schema.Struct({
  'where[id]': Schema.optional(Schema.String),
  per_page: Schema.optional(Schema.Number),
  offset: Schema.optional(Schema.Number),
  order: Schema.optional(
    Schema.Literal(
      'accounting_administrator',
      'anniversary',
      'birthdate',
      'child',
      'created_at',
      'first_name',
      'gender',
      'given_name',
      'grade',
      'graduation_year',
      'inactivated_at',
      'last_name',
      'membership',
      'middle_name',
      'nickname',
      'people_permissions',
      'remote_id',
      'site_administrator',
      'status',
      'updated_at',
    ),
  ),
})
export type GetPeopleQuery = Schema.Schema.Type<typeof GetPeopleQuery>

export const GetPeopleResponse = Schema.Struct({
  ...APICollection.fields,
  data: Schema.Array(Person),
})
export type GetPeopleResponse = Schema.Schema.Type<typeof GetPeopleResponse>
