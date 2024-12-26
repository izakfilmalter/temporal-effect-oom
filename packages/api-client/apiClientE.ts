import { Api, Client } from '@steepleinc/effect-http'
import { pipe } from 'effect'

import { pcoPeopleApi } from './apiPeople'

const pcoApi = pipe(Api.make(), Api.addGroup(pcoPeopleApi))

export const apiClientE = Client.make(pcoApi, {
  baseUrl: 'http://localhost:3002',
})
