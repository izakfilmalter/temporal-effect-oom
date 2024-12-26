import { Api, ApiGroup } from '@steepleinc/effect-http'

import {
  GetPeopleQuery,
  GetPeopleResponse,
} from '@if/api/src/helpers/apiPeopleTypes'

export const pcoPeopleApi = ApiGroup.make('people').pipe(
  ApiGroup.addEndpoint(
    Api.get('getPeople', '/people').pipe(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Api.setRequestQuery(GetPeopleQuery),
      Api.setResponseBody(GetPeopleResponse),
    ),
  ),
)
