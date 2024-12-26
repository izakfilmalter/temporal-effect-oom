1. Install deps with Yarn
2. Install local temporal: `brew install temporal`
3. Start local temporal: `yarn start:temporal-server`
4. Start API: `yarn dev`
5. Start Workers: `yarn dev:workers`
6. Visit `http://localhost:3002`. This will kick off 4000 workflows that 
   slam the api. You can see the RSS memory increase and then OOM.
7. See workflows at `http://localhost:8233/namespaces/prod/workflows?per-page=500`

Once you have visited the url, it will load up 4000 workflows that will get 
data and smash the rate limit. Once it ooms, you don't have to visit the url 
again, just restart the workers and they will try again.

You can edith `packages/api/src/routes/index.ts` to change the max number of 
workflows if you want. If you want a slow leak, try 100. 
