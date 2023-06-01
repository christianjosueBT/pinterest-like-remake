import csDAO from '../dao/coffeeshopsDAO.js'
import usersDAO from '../dao/usersDAO.js'

import { Uri, port, db } from '../../config.js'
import { MongoClient, ServerApiVersion } from 'mongodb'
import { names, cloud, reviews } from './names.js'
import bcrypt from 'bcryptjs'

const hashPassword = async password => await bcrypt.hash(password, 10)

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
    client.db(db).dropDatabase()

    await csDAO.initialize(client)
    await usersDAO.initialize(client)

    await csDAO.injectDB(client)
    await usersDAO.injectDB(client)

    const seedResult = await seedDB(50)
    console.log(seedResult)
    process.exit(1)
  })
  .catch(err => {
    console.error('error in line 34', err)
    process.exit(1)
  })

const sample = array => array[Math.floor(Math.random() * array.length)]
const arr = [1, 2, 3]

// 'https://res.cloudinary.com/christianjosuebt/image/upload/v1619795178/coffeeShops/'

const seedDB = async num => {
  const username = 'idfklmao'
  const password = 'idfklmao'
  const email = 'idfklmao@gmail.com'
  const profilePicture = {
    url: 'https://res.cloudinary.com/christianjosuebt/image/upload/v1619026522/coffeeShops/smile_bpkzip.svg',
    filename: 'smile_bpkzip',
  }

  const userInfo = {
    email,
    username,
    password: await hashPassword(password),
    profilePicture,
  }

  const insertResult = await usersDAO.addUser(userInfo)
  let userId

  if (insertResult.success) userId = insertResult._id
  else return { error: insertResult.error }

  for (let i = 0; i < num; i++) {
    const name = sample(names)
    const review = reviews.filter(entry => entry.name === name)[0]
    const reviewBody = review.review
    const rating = review.rating

    const sampleImages = []
    for (let j = 0; j < 4; j++) {
      let sampleImage = sample(cloud)
      while (sampleImages.includes(sampleImage)) sampleImage = sample(cloud)
      sampleImages.push(sampleImage)
    }
    // https://res.cloudinary.com/christianjosuebt/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1619798171/coffeeShops/zoe-3hs4xso-4KM-unsplash_htobzn.jpg
    // https://res.cloudinary.com/christianjosuebt/image/upload/v1619798171/coffeeShops/zoe-3hs4xso-4KM-unsplash_htobzn.jpg
    // q_auto,f_auto,fl_lossy
    const images = [
      {
        url: `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy/coffeeShops/${sampleImages[0]}`,
        filename: sampleImages[0],
      },
      {
        url: `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy/coffeeShops/${sampleImages[1]}`,
        filename: sampleImages[1],
      },
      {
        url: `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy/coffeeShops/${sampleImages[2]}`,
        filename: sampleImages[2],
      },
      {
        url: `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy/coffeeShops/${sampleImages[3]}`,
        filename: sampleImages[3],
      },
    ]
    const p = sample(arr)
    let price = ''
    if (p === 1) price = 'Cheap'
    else if (p === 2) price = 'Average'
    else if (p === 3) price = 'Expensive'

    const coffeeShopInfo = {
      author: userId,
      name,
      price,
      images,
    }

    // console.log(typeof coffeeShopInfo.author)

    const csInsertResult = await csDAO.newCoffeeShop(coffeeShopInfo)
    let csId

    if (csInsertResult.success) csId = csInsertResult._id
    else {
      console.error('error in line 115', csInsertResult)
      return { error: csInsertResult }
    }

    const reviewInfo = {
      author: userId,
      body: reviewBody,
      coffeeShop: csId,
      rating,
    }

    console.log('reviewInfo:', reviewInfo)

    const reviewInsertResult = await csDAO.newReview(reviewInfo)
    let reviewId

    if (reviewInsertResult.success) reviewId = reviewInsertResult._id
    else return { error: reviewInsertResult.error }
  }
  return `successfully seeded ${num} coffee shops!`
}
