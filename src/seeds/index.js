const mongoose = require('mongoose')
const User = require('../models/user')
const CoffeeShop = require('../models/coffeeShop')
const Review = require('../models/review')
const { adjectives, nouns, cloud } = require('./names')

mongoose
  .connect('mongodb://localhost: 27017/practice', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .catch(error => console.log(error))

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  console.log('Database connected')
})

const sample = array => array[Math.floor(Math.random() * array.length)]
const arr = [1, 2, 3]

// 'https://res.cloudinary.com/christianjosuebt/image/upload/v1619795178/coffeeShops/'

const seedDB = async num => {
  await CoffeeShop.deleteMany({})
  await User.deleteMany({})
  await Review.deleteMany({})
  const password = 'idklol'
  const username = 'idklol'
  const user = new User({
    email: 'idklol@gmail.com',
    username,
    password,
  })
  const body = 'pretty good place!'
  for (let i = 0; i < num; i++) {
    const name = `${sample(adjectives)} ${sample(nouns)}`
    const rating = Math.random() * 5
    // const unsplash = [
    //     `https://source.unsplash.com/collection/${sample(collections)}`,
    //     `https://source.unsplash.com/collection/${sample(collections)}`,
    //     `https://source.unsplash.com/collection/${sample(collections)}`,
    //     `https://source.unsplash.com/collection/${sample(collections)}`
    // ];
    const samples = []
    for (let j = 0; j < 4; j++) {
      samples.push(sample(cloud))
    }
    // https://res.cloudinary.com/christianjosuebt/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1619798171/coffeeShops/zoe-3hs4xso-4KM-unsplash_htobzn.jpg
    // https://res.cloudinary.com/christianjosuebt/image/upload/v1619798171/coffeeShops/zoe-3hs4xso-4KM-unsplash_htobzn.jpg
    // q_auto,f_auto,fl_lossy
    const images = [
      {
        url: `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy/coffeeShops/${samples[0]}`,
        filename: samples[0],
      },
      {
        url: `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy/coffeeShops/${samples[1]}`,
        filename: samples[1],
      },
      {
        url: `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy/coffeeShops/${samples[2]}`,
        filename: samples[2],
      },
      {
        url: `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy/coffeeShops/${samples[3]}`,
        filename: samples[3],
      },
    ]
    const p = sample(arr)
    let price = ''
    if (p === 1) price = 'Cheap'
    else if (p === 2) price = 'Average'
    else if (p === 3) price = 'Expensive'
    const review = new Review({
      author: user._id,
      body,
      rating,
    })
    const coffeeShop = new CoffeeShop({
      author: user._id,
      name,
      price,
      description:
        'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Non, laudantium magnam. Deserunt explicabo, aspernatur esse cumque ratione reprehenderit molestiae aliquid. Illum nemo sed amet quae mollitia fuga minus quibusdam perferendis.',
      images,
    })
    coffeeShop.reviews.push(review)
    user.coffeeShops.push(coffeeShop._id)
    user.reviews.push(review._id)
    await coffeeShop.save()
    await review.save()
  }
  await user.save()
}

seedDB(50)
