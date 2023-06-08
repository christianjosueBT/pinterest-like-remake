import { db } from '../../config.js'
import { ObjectId } from 'bson'
import usersDAO from './usersDAO.js'

let coffeeShops, reviews
const DEFAULT_SORT = { name: 1 }

export default class coffeeShopsDAO {
  static async initialize(conn) {
    await conn.db(db).createCollection('coffeeshops', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          title: 'Coffee Shop Object Validation',
          required: ['author', 'name', 'price', 'images', 'createdDate'],
          properties: {
            author: {
              bsonType: 'objectId',
              description:
                "'author' is a reference to the user account that created it",
            },
            name: {
              bsonType: 'string',
            },
            price: {
              bsonType: 'string',
              enum: ['Cheap', 'Average', 'Expensive'],
            },
            reviews: {
              bsonType: ['array'],
              uniqueItems: true,
              description:
                "'reviews' must be an array of objectIds, each one being a reference to the review",
              items: {
                bsonType: ['objectId'],
              },
            },
            images: {
              bsonType: ['array'],
              description:
                "'images' must be an array of objects, each one containing the url and name of an image",
              items: {
                bsonType: ['object'],
                required: ['url', 'filename'],
                properties: {
                  url: {
                    bsonType: 'string',
                  },
                  filename: {
                    bsonType: 'string',
                  },
                },
              },
            },
            createdDate: {
              bsonType: 'date',
              description: 'date object of when this coffee shop was created',
            },
          },
        },
      },
    })

    await conn.db(db).createCollection('reviews', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          title: 'Review Object Validation',
          required: ['author', 'body', 'coffeeShop', 'rating', 'createdDate'],
          properties: {
            author: {
              bsonType: 'objectId',
              description: 'reference to the user account that created it',
            },
            body: {
              bsonType: 'string',
              description: 'the body of the review',
            },
            coffeeShop: {
              bsonType: 'objectId',
              description: 'reference to the coffee shop the review is of',
            },
            rating: {
              bsonType: 'int',
              description: 'rating must be an integer value from 0 to 5',
            },
            createdDate: {
              bsonType: 'date',
              description: 'date object of when this coffee shop was created',
            },
          },
        },
      },
    })
  }

  static async injectDB(conn) {
    if (coffeeShops || reviews) return
    try {
      conn
      coffeeShops = await conn.db(db).collection('coffeeshops')
      reviews = await conn.db(db).collection('reviews')
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in coffeeshopsDAO: ${e}`
      )
    }
  }

  static async newCoffeeShop(shopInfo) {
    shopInfo.author = new ObjectId(shopInfo.author)
    shopInfo.createdDate = new Date()

    try {
      // inserting a new coffee shop to the database
      let result = await coffeeShops.insertOne({
        ...shopInfo,
      })

      // making the insertedId a valid ObjectId if it isnt
      if (!ObjectId.isValid(result.insertedId))
        result.insertedId = ObjectId(result.insertedId)

      // updating the user account that is making this coffee shop
      const updateUser = await usersDAO.update(
        shopInfo.author,
        { $push: { coffeeShops: result.insertedId } },
        true
      )

      return { success: true, _id: result.insertedId }
    } catch (e) {
      console.error(
        'Error occurred while adding a new coffee shop to the database',
        e
      )
      return { error: e }
    }
  }

  // /**
  //  * Finds and returns shops
  //  * Can be used with or without a query
  //  * ONLY TEXT QUERYS ON NAME FIELD SUPPORTED RN
  //  * @param {Object} filters search parameters used in the query
  //  * @param {number} page Page
  //  * @param {number} entries number of shops per page
  //  * @returns {GetCoffeeShopsResult} object with the matched shop results
  //  */
  // static async getCoffeeShops({
  //   // default parameters
  //   filters = null,
  //   page = 0,
  //   project = [],
  //   rating = false,
  //   entries = 10,
  // } = {}) {
  //   let p = {}
  //   let queryParams = {}

  //   for (const key of project) {
  //     key.includes('id') ? (p._id = 0) : (p[key] = 1)
  //   }
  //   if (rating) {
  //     p.reviews = 1
  //     p.rating = { $avg: '$' }
  //   }
  //   // if (filters) {
  //   //   if ('name' in filters)
  //   //     queryParams = this.textSearchQuery(filters['text']);
  //   // }
  //   let { query = {}, sort = DEFAULT_SORT } = queryParams
  //   let cursor
  //   try {
  //     cursor = await coffeeShops.find(query).project(p).sort(sort)
  //   } catch (e) {
  //     console.error(
  //       `Unable to find coffee shops in DAO getCoffeeShops() function 😩😩😩\n${e}`
  //     )
  //     console.error(
  //       `Unable to find coffee shops in DAO getCoffeeShops() function 😩😩😩\n${e}`
  //     )
  //     return { shopsList: [], totalNumShops: 0 }
  //   }
  //   // Paging implementation
  //   const displayCursor = cursor.limit(entries).skip(page * entries)
  //   try {
  //     const shopsList = await displayCursor.toArray()
  //     // mongodb collection method that returns the number of items in the collection
  //     // that match the query
  //     const totalNumShops =
  //       shopsList.length > 0 ? await coffeeShops.countDocuments(query) : 0
  //     return { shopsList, totalNumShops }
  //   } catch (e) {
  //     console.error(
  //       `Unable to convert cursor to array or problem counting documents in getCoffeeShops function 😩😩😩\n${e}`
  //     )
  //     return { shopsList: [], totalNumShops: 0 }
  //   }
  // }

  /**
   * Finds and returns shops
   * Can be used with or without a query
   * ONLY TEXT QUERYS ON NAME FIELD SUPPORTED RN
   * @param {Object} filters search parameters used in the query
   * @param {number} page Page
   * @param {number} entries number of shops per page
   * @returns {GetCoffeeShopsResult} object with the matched shop results
   */
  static async getCoffeeShops({
    // default parameters
    page = 0,
    project = [],
    rating = false,
    entries = 10,
  } = {}) {
    let p = {}
    let queryParams = {}

    if (Object.keys(project).length === 0) {
      project = ['name']
    }

    for (const key of project) {
      key.includes('id') ? (p._id = 0) : (p[key] = 1)
    }

    let cursor
    let pipeline = []

    if (rating) {
      let lookup = {
          $lookup: {
            from: 'reviews',
            localField: 'reviews',
            foreignField: '_id',
            as: 'reviews',
          },
        },
        addFields = {
          $addFields: {
            avgRating: { $avg: '$reviews.rating' },
            reviewsCount: { $size: '$reviews' },
          },
        }

      pipeline.push(lookup, addFields)
    }

    try {
      cursor = await coffeeShops.aggregate(pipeline)
    } catch (e) {
      console.error(`Error in DAO nameSearch() function 😩😩😩\n${e}`)
      return { shopsList: [] }
    }
    // Paging implementation
    const displayCursor = cursor.limit(entries).skip(page * entries)
    try {
      // const shopsList = await displayCursor.toArray()
      const shopsList = await displayCursor.toArray()

      return { shopsList }
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents in getCoffeeShops function 😩😩😩\n${e}`
      )
      return { shopsList: [], totalNumShops: 0 }
    }
  }

  static async nameSearch({
    // default parameters
    name = null,
    page = 0,
    project = [],
    entries = 10,
  } = {}) {
    if (!name || name === '') {
      throw new Error('Must provide a string to search with.')
    }
    if (Object.keys(project).length === 0) {
      project = ['name']
    }
    let p = {}
    for (const key of project) {
      key.includes('id') ? (p._id = 0) : (p[key] = 1)
    }
    // if (filters) {
    //   if ('name' in filters)
    //     queryParams = this.textSearchQuery(filters['text']);
    // }

    let cursor
    let pipeline = [
      {
        $search: {
          index: 'default',
          text: { path: 'name', query: `${name}`, fuzzy: {} },
        },
      },
      { $project: p },
    ]
    try {
      cursor = coffeeShops.aggregate(pipeline)
    } catch (e) {
      console.error(`Error in DAO nameSearch() function 😩😩😩\n${e}`)
      return { shopsList: [], totalNumShops: 0 }
    }
    // Paging implementation
    const displayCursor = cursor.limit(entries).skip(page * entries)
    try {
      const shopsList = await displayCursor.toArray()
      pipeline.push({ $count: 'count' })
      // mongodb collection method that returns the number of items in the collection that match the query
      let totalNumShops = await coffeeShops.aggregate(pipeline).toArray()
      totalNumShops = totalNumShops[0].count

      return { shopsList, totalNumShops }
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents in nameSearch function 😩😩😩\n${e}`
      )
      return { shopsList: [], totalNumShops: 0 }
    }
  }

  static async update(id, author, updateObj) {
    if (typeof author === 'string') author = ObjectId(author)
    if (typeof id === 'string') id = ObjectId(id)

    try {
      let coffeeShop = await coffeeShops.updateOne(
        { _id: id, author: author },
        updateObj
      )
      if (coffeeShop.acknowledged && coffeeShop.matchedCount > 0)
        return { ok: true }
      else return { ok: false }
    } catch (e) {
      console.error(`error updating coffee shop, ${e.message}`)
      return { error: e, ok: false }
    }
  }

  static async findById({ id = null, populate = [] } = {}) {
    let lookup = {}
    const pipeline = [
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
    ]

    if (populate.length > 0) {
      if (populate[0] === 'reviews')
        lookup = {
          $lookup: {
            from: 'reviews',
            localField: 'reviews',
            foreignField: '_id',
            as: 'reviews',
          },
        }
      else if (populate[0] === 'author')
        lookup = {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        }
      if (populate.length > 1) {
        if (populate[1] === 'author')
          lookup.$lookup.pipeline = [
            {
              $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'author',
              },
            },
          ]
      }
    }
    if (Object.keys(lookup).length > 0) pipeline.push(lookup)

    try {
      let res = await coffeeShops.aggregate(pipeline).next()
      if (!res) throw new Error('Coffee shop not found')
      return res
    } catch (e) {
      console.error(`Something went wrong in DAO findById: ${e}`)
      throw e
    }
  }

  static async delete(id, userId) {
    if (!ObjectId.isValid(id)) id = ObjectId(id)
    if (!ObjectId.isValid(userId)) id = ObjectId(userId)
    try {
      let deleteResult = await coffeeShops.deleteOne({
        _id: id,
        author: userId,
      })

      // updating the user account
      const updateUser = await usersDAO.update(
        userId,
        {
          $pull: { coffeeShops: id },
        },
        false
      )

      return deleteResult.deletedCount > 0 ? { ok: true } : { ok: false }
    } catch (e) {
      console.error(`error deleting coffee shop, ${e.message}`)
      return { error: e.message, ok: false }
    }
  }

  /**
   * Inserts a new review to the database.
   * Updates the user and coffee shop, adding the review to the user profile and to the coffee shop document
   * @param {Object} reviewInfo Information necessary to create a new review
   * @returns {Object} Either an object with success:true and the inserted review id or an error object
   */
  static async newReview(reviewInfo) {
    reviewInfo.author = new ObjectId(reviewInfo.author)
    reviewInfo.coffeeShop = new ObjectId(reviewInfo.coffeeShop)
    reviewInfo.createdDate = new Date()

    try {
      // inserting review to the database
      let result = await reviews.insertOne({
        ...reviewInfo,
      })
      console.log('reviewInfo:', reviewInfo)
      // making the insertedId a valid ObjectId if it isnt
      if (!ObjectId.isValid(result.insertedId))
        result.insertedId = ObjectId(result.insertedId)
      // updating the coffee shop that the review is of
      const updateCS = await coffeeShops.updateOne(
        { _id: reviewInfo.coffeeShop },
        { $push: { reviews: result.insertedId } },
        { upsert: true }
      )

      // updating the user account that is making the review
      const updateUser = await usersDAO.update(
        reviewInfo.author,
        { $push: { reviews: result.insertedId } },
        true
      )

      return { success: true, _id: result.insertedId }
    } catch (e) {
      console.error(
        `Error occurred while adding a new review to the database, ${e}.`
      )
      return { error: e }
    }
  }

  static async deleteReview(id, userId, csId) {
    if (!ObjectId.isValid(id)) id = ObjectId(id)
    if (!ObjectId.isValid(userId)) userId = ObjectId(userId)
    if (!ObjectId.isValid(userId)) csId = ObjectId(csId)

    try {
      let deleteResult = await reviews.deleteOne({ _id: id, author: userId })

      // updating the coffee shop that the review is of
      const updateCS = await coffeeShops.updateOne(
        { _id: csId },
        { $pull: { reviews: id } }
      )

      // updating the user account
      const updateUser = await usersDAO.update(
        userId,
        {
          $pull: { reviews: id },
        },
        false
      )

      return deleteResult.deletedCount > 0 ? { ok: true } : { ok: false }
    } catch (e) {
      console.error(`error deleting review, ${e.message}`)
      return { error: e.message, ok: false }
    }
  }

  static async findReviewById({ id = null, populate = [] } = {}) {
    let lookup = {}
    const pipeline = [
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
    ]

    for (let el of populate) {
      if (el === 'author') {
        lookup = {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        }
        pipeline.push(lookup)
      } else if (el === 'coffeeShop') {
        lookup = {
          $lookup: {
            from: 'coffeeshops',
            localField: 'coffeeShop',
            foreignField: '_id',
            as: 'coffeeShop',
          },
        }
        pipeline.push(lookup)
      }
    }

    try {
      let res = await reviews.aggregate(pipeline).next()
      if (!res) throw new Error('Review not found')
      return res
    } catch (e) {
      console.error(`Something went wrong in DAO findById: ${e}`)
      throw e
    }
  }
}
