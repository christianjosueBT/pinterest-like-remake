import { db } from '../../config.js'
import { ObjectId } from 'bson'
import usersDAO from './usersDAO.js'

let coffeeShops, reviews
const DEFAULT_SORT = { name: 1 }

export default class coffeeShopsDAO {
  static async injectDB(conn) {
    if (coffeeShops || reviews) return
    try {
      coffeeShops = await conn.db(db).collection('coffeeshops')
      reviews = await conn.db(db).collection('reviews')
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in coffeeshopsDAO: ${e}`
      )
    }
  }

  static async newCoffeeShop(shopInfo) {
    if (typeof shopInfo.author === 'string')
      shopInfo.author = ObjectId(shopInfo.author)
    try {
      let result = await coffeeShops.insertOne({
        ...shopInfo,
        author: shopInfo.author,
      })
      return { success: true, _id: result.insertedId }
    } catch (e) {
      console.error(
        `Error occurred while adding a new coffee shop to the database, ${e}.`
      )
      return { error: e }
    }
  }

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
    filters = null,
    page = 0,
    project = [],
    entries = 10,
  } = {}) {
    let p = {}
    let queryParams = {}

    for (const key of project) {
      key.includes('id') ? (p._id = 0) : (p[key] = 1)
    }
    // if (filters) {
    //   if ('name' in filters)
    //     queryParams = this.textSearchQuery(filters['text']);
    // }
    let { query = {}, sort = DEFAULT_SORT } = queryParams
    let cursor
    try {
      cursor = await coffeeShops.find(query).project(p).sort(sort)
    } catch (e) {
      console.error(
        `Unable to find coffee shops in DAO getCoffeeShops() function 😩😩😩\n${e}`
      )
      return { shopsList: [], totalNumShops: 0 }
    }
    // Paging implementation
    const displayCursor = cursor.limit(entries).skip(page * entries)
    try {
      const shopsList = await displayCursor.toArray()
      // mongodb collection method that returns the number of items in the collection
      // that match the query
      const totalNumShops =
        shopsList.length > 0 ? await coffeeShops.countDocuments(query) : 0
      return { shopsList, totalNumShops }
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
    let aggregate = [
      { $search: { text: { path: 'name', query: `${name}`, fuzzy: {} } } },
    ]
    try {
      cursor = coffeeShops.aggregate(aggregate).project(p)
    } catch (e) {
      console.error(`Error in DAO nameSearch() function 😩😩😩\n${e}`)
      return { shopsList: [], totalNumShops: 0 }
    }
    // Paging implementation
    const displayCursor = cursor.limit(entries).skip(page * entries)
    try {
      const shopsList = await displayCursor.toArray()
      aggregate.push({ $count: 'count' })
      // mongodb collection method that returns the number of items in the collection that match the query
      let totalNumShops = await coffeeShops.aggregate(aggregate).toArray()
      totalNumShops = totalNumShops[0].count
      return { shopsList, totalNumShops }
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents in getCoffeeShops function 😩😩😩\n${e}`
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
    if (typeof id === 'string') id = ObjectId(id)
    let lookup = {}
    const pipeline = [
      {
        $match: {
          _id: id,
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
      return await coffeeShops.aggregate(pipeline).next()
    } catch (e) {
      console.error(`Something went wrong in DAO findById: ${e}`)
      throw e
    }
  }

  static async delete(id, userId) {
    if (typeof id === 'string') id = ObjectId(id)
    if (typeof userId === 'string') userId = ObjectId(userId)
    try {
      let deleteResult = await coffeeShops.deleteOne({
        _id: id,
        author: userId,
      })
      return deleteResult.deletedCount > 0 ? { ok: true } : { ok: false }
    } catch (e) {
      console.error(`error deleting coffee shop, ${e.message}`)
      return { error: e.message, ok: false }
    }
  }

  static async deleteReview(id, userId) {
    if (typeof id === 'string') id = ObjectId(id)
    if (typeof userId === 'string') userId = ObjectId(userId)

    try {
      let deleteResult = await reviews.deleteOne({ _id: id, author: userId })
      return deleteResult.deletedCount > 0 ? { ok: true } : { ok: false }
    } catch (e) {
      console.error(`error deleting review, ${e.message}`)
      return { error: e.message, ok: false }
    }
  }
}
