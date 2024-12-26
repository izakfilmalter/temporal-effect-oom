import path from 'path'
import express from 'express'
import { createRouter } from 'express-file-routing'
import { rateLimit } from 'express-rate-limit'

import { getDirname } from './utils.js'

const __dirname = getDirname(import.meta.url) // Call the utility function

const app = express()

const limiter = rateLimit({
  windowMs: 20 * 1000, // 20 seconds
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

// Apply the rate limiting middleware to all requests.
app.use(limiter)

// Specify the routes directory inside 'src'
await createRouter(app, {
  directory: path.join(__dirname, 'routes'),
})

app.listen(3002, () => {
  console.log('Server is running on port 3002')
})

export default app
