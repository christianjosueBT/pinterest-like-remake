import { Uri, secret, db } from '../config.js'

// my ip address: 10.0.0.154
import { URL, fileURLToPath } from 'url'
import express from 'express'
import session from 'express-session'
import methodOverride from 'method-override'
import MongoDBStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
// import cors from 'cors';

// import productsAPI from './api/products.routes.js';
import coffeeShopsAPI from './api/coffeeshops.routes.js'
import usersAPI from './api/users.routes.js'
import home from '../views/routes/home.routes.js'
import users from '../views/routes/users.routes.js'

// import products from '../views/routes/products.routes.js';

const __public = fileURLToPath(new URL('../public', import.meta.url))

const app = express()
// const corsOptions = {
//   origin: ['https://localhost', 'https://chris-desktop', 'https://10.0.0.154'],
//   credentials: true,
//   allowedHeaders: 'Content-Type,Authorization,Refresh',
// };
const sessionOptions = {
  mongoUrl: Uri,
  dbName: db,
  crypto: {
    secret,
  },
  touchAfter: 24 * 60 * 60,
}
const sessionConfig = {
  store: MongoDBStore.create(sessionOptions),
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}

app.use(cookieParser())
app.use(methodOverride('_method'))
// app.use(cors(corsOptions));
app.use(express.static(__public))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session(sessionConfig))

app.use((req, res, next) => {
  res.locals.user = req.session.user
  next()
})

// Register api routes
app.use('/', home)
app.use('/users', users)
// app.use('/products', products);
app.use('/api/v1/coffeeshops', coffeeShopsAPI)
app.use('/api/v1/users', usersAPI)
app.use('*', (req, res) => res.status(404).json({ error: 'not found' }))

export default app
