import { db } from '../../config.js'
import { ObjectId } from 'bson'

let users, sessions

export default class UsersDAO {
  static async initialize(conn) {
    await conn.db(db).createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          title: 'User Object Validation',
          required: [
            'username',
            'password',
            'email',
            'profilePicture',
            'createdDate',
          ],
          properties: {
            username: {
              bsonType: 'string',
              minLength: 3,
            },
            password: {
              bsonType: 'string',
              minLength: 8,
            },
            email: {
              bsonType: 'string',
            },
            profilePicture: {
              bsonType: 'object',
              description:
                "'profilePicture' must have url and filename properties",
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
            coffeeShops: {
              bsonType: ['array'],
              uniqueItems: true,
              description:
                "'coffeeShops' must be an array of objectIds, each one being a reference to the coffee shops the user is the author of",
              items: {
                bsonType: ['objectId'],
              },
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
    if (users || sessions) return
    try {
      users = await conn.db(db).collection('users')
      sessions = await conn.db(db).collection('sessions')
    } catch (e) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`)
    }
  }

  /**
   * Finds a user in the `users` collection
   * @param {string} email - The email of the desired user
   * @returns {Object | null} Returns either a single user or nothing
   */
  static async getUser(type, query) {
    return await users.findOne({ [type]: query })
  }

  /**
   * Finds a session in the `sessions` collection
   * @param {string} email - The email of the desired user
   * @returns {Object | null} Returns either a single user or nothing
   */
  static async getSession(id) {
    return await sessions.findOne({ _id: id })
  }

  /**
   * Finds a user in the `users` collection using the provided id
   * @param {string} id - User id
   * @returns {Object | null} Returns either a single user or nothing
   */
  static async findById(id) {
    if (typeof id === 'string') id = new ObjectId(id)
    try {
      const pipeline = [
        {
          $match: {
            _id: id,
          },
        },
      ]

      return await users.aggregate(pipeline).next()
    } catch (e) {
      console.error(`Something went wrong in DAO findById: ${e}`)
      throw e
    }
  }

  /**
   * Adds a user to the `users` collection
   * @param {UserInfo} userInfo - The information of the user to add
   * @returns {DAOResponse} Returns either a "success" or an "error" Object
   */
  static async addUser(userInfo) {
    try {
      userInfo.createdDate = new Date()
      const result = await users.insertOne(userInfo)
      return { success: true, _id: result.insertedId }
    } catch (e) {
      if (String(e).startsWith('MongoError: E11000 duplicate key error')) {
        return { error: 'A user with the given email already exists.' }
      }
      console.error(`Error occurred while adding new user, ${e}.`)
      return { success: true, error: e }
    }
  }

  /**
   * Invalidates a refresh token by removing it from the refreshTokens collection
   * @param {string} refreshToken - The refresh JSON web token to invalidate
   * @returns {DAOResponse} Returns either a "success" or an "error" Object
   */
  static async logoutUser() {
    try {
      await refreshTokens.deleteOne({ token: refreshObj.token })
      return { success: true }
    } catch (e) {
      console.error(`Error occurred while logging out user, ${e}`)
      return { error: e }
    }
  }

  /**
   * Removes a user from the `sessions` and `users` collections
   * @param {string} email - The email of the user to delete
   * @returns {DAOResponse} Returns either a "success" or an "error" Object
   */
  static async deleteUser(email) {
    try {
      await users.deleteOne({ email })
      await refreshTokens.deleteOne({ token: refreshObj.token })
      if (
        !(await this.getUser(email)) &&
        !(await this.getRefreshToken(refreshObj))
      ) {
        return { success: true }
      } else {
        console.error(`Deletion unsuccessful`)
        return { error: `Deletion unsuccessful` }
      }
    } catch (e) {
      console.error(`Error occurred while deleting user, ${e}`)
      return { error: e, ok: false }
    }
  }

  static async update(id, updateObj, upsert) {
    try {
      let user = await users.updateOne({ _id: id }, updateObj, {
        upsert: upsert,
      })
      if (user.modifiedCount > 0) return { ok: true }
      else return { ok: false }
    } catch (e) {
      console.error(`error updating user, ${e}`)
      return { error: e, ok: false }
    }
  }
}
