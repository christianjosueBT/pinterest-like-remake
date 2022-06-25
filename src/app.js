// hello!
import { Uri, port } from '../config.js'

import server from './server.js'
import { MongoClient, ServerApiVersion } from 'mongodb'

import CoffeeShopsDAO from './dao/coffeeshopsDAO.js'
import UsersDAO from './dao/usersDAO.js'

// connecting to mongodb using the mongodb driver!
MongoClient.connect(Uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
  // poolSize: 50,
  wtimeoutMS: 2000,
})
  .catch(err => {
    console.error(err.stack)
    process.exit(1)
  })
  .then(async client => {
    await CoffeeShopsDAO.injectDB(client)
    await UsersDAO.injectDB(client)

    server.listen(port, () => {
      console.log(`listening on port ${port}`)
    })
  })
