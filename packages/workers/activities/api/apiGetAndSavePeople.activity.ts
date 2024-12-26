import type { GetPeopleQuery } from '@if/api-client'
import { apiClientE } from '@if/api-client'
import { apiGetAndSaveCache } from '@if/workers/helpers/api/apiGetAndSave'

export const apiGetAndSavePeople = async (params: {
  query?: GetPeopleQuery
}) => {
  const {
    query = {
      per_page: 100,
    } satisfies GetPeopleQuery,
  } = params

  return apiGetAndSaveCache({
    query,
    get: apiClientE.getPeople,
  })
}
