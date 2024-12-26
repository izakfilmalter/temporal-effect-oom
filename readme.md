1. Install deps with Yarn
2. Install local temporal: `brew install temporal`
3. Start local temporal: `yarn start:temporal-server`
4. Start API: `yarn dev`
5. Start Workers: `yarn dev:workers`
6. Visit `http://localhost:3002`. This will kick off 4000 workflows that 
   slam the api. You can see the RSS memory increase and then OOM.
