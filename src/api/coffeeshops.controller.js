// import res from 'express/lib/response';
import csDAO from '../dao/coffeeshopsDAO.js'
import UsersDAO from '../dao/usersDAO.js'
import { ObjectId } from 'bson'

export default class coffeeShopsController {
  static async getCoffeeShops(req, res, next) {
    let filters = {},
      page,
      project,
      entries

    try {
      page = req.query.page ? parseInt(req.query.page, 10) : 0
      project = req.query.project ? req.query.project.split(',') : []
      entries = req.query.entries ? parseInt(req.query.entries, 10) : 10
    } catch (e) {
      console.error(`Got bad value for page, project, or entries: ${e}`)
      page = 0
      project = []
      entries = 10
    }
    const { shopsList, totalNumShops } = await csDAO.getCoffeeShops({
      filters,
      page,
      project,
      entries,
    })

    let response = {
      shops: shopsList,
      page: page,
      filters: {},
      entries,
      total_results: totalNumShops,
    }
    return res.json(response)
  }

  static async newCoffeeShop(req, res, next) {
    try {
      // getting user info from request body and validating the info
      const shopFromBody = req.body
      let errors = {}
      if (
        !shopFromBody.author ||
        !shopFromBody.name ||
        !shopFromBody.price ||
        !shopFromBody.description
      ) {
        errors.missingField = 'Expected author, name, price, and description'
      }

      let user = await UsersDAO.findById(shopFromBody.author)
      if (!user) {
        errors.author = 'The author of this shop does not exist.'
      }
      if (Object.keys(errors).length > 0) {
        res.status(400).json(errors)
        return
      }

      const insertResult = await csDAO.newCoffeeShop(shopFromBody)
      if (!insertResult.success || !insertResult._id) {
        errors.insert = insertResult.error
      }
      const coffeeshopFromDB = await csDAO.findById({ id: insertResult._id })
      if (!coffeeshopFromDB)
        errors.coffeeshop = 'Problem fetching the newly created coffee shop'

      const updateObj = {
        $push: { coffeeShops: insertResult._id },
      }

      let updateResult = await UsersDAO.update(user._id, updateObj)
      if (!updateResult.ok)
        errors.updateUser =
          'Problem updating the author of this new coffee shop'

      if (Object.keys(errors).length > 0) {
        res.status(400).json(errors)
        return
      }

      // sending user, successful status and response
      res.status(200).json({
        message: 'successfully created a new coffeeshop',
        ok: true,
        coffeeshop: coffeeshopFromDB,
      })
    } catch (e) {
      res.status(500).json({ error: e })
    }
  }

  static async searchCoffeeShops(req, res, next) {
    let filters = {},
      page,
      project,
      entries

    try {
      page = req.query.page ? parseInt(req.query.page, 10) : 0
      project = req.query.project ? req.query.project.split(',') : []
      entries = req.query.entries ? parseInt(req.query.entries, 10) : 10
    } catch (e) {
      console.error(`Got bad value for page, project, or entries: ${e}`)
      page = 0
      project = []
      entries = 10
    }

    let searchType
    try {
      searchType = req.query.type
    } catch (e) {
      console.error(`No search keys specified: ${e}`)
    }

    let shopsList, totalNumShops
    switch (searchType) {
      case 'name':
        if (req.query.name !== '') {
          ;({ shopsList, totalNumShops } = await csDAO.nameSearch({
            name: req.query.name,
            page,
            project,
            entries,
          }))
        }
        break
      // case 'price':
      //   if (req.query.price !== '') {
      //     filters.price = req.query.price;
      //   }
      //   break;
      // case 'reviews':
      //   if (req.query.reviews !== '') {
      //     filters.reviews = req.query.reviews;
      //   }
      //   break;
      default:
      // nothing to do
    }

    let response = {
      shops: shopsList,
      page: page,
      filters,
      entries_per_page: entries,
      total_results: totalNumShops,
    }

    res.json(response)
  }

  static async update(req, res, next) {
    let csFromBody,
      id,
      errors = {}
    try {
      csFromBody = { ...req.body }
      id = req.params.id
    } catch (e) {
      console.error(
        `problem getting coffee shop info from body or no id was provided, ${e}`
      )
    }

    // the stored session cookie contains the session _id along with some other stuff idk why
    // so we extract the session _id from the session cookie
    let sessionUserId = req.get('user')
    let user = await UsersDAO.findById(sessionUserId)
    if (!user) errors.author = 'The author of this shop does not exist.'

    let coffeeShop = await csDAO.findById({ id })
    if (!coffeeShop)
      errors.coffeeShopError = `A coffee shop with id ${id} does not exist`

    if (Object.keys(errors).length > 0) {
      res.status(400).json(errors)
      return
    }

    const updateObj = { $set: {} }
    for (const key in csFromBody) {
      if (key !== 'images') updateObj.$set[key] = csFromBody[key]
    }

    if (csFromBody.images && Object.keys(csFromBody.images).length > 0) {
      updateObj.$push = { images: csFromBody.images }
    }

    let updateResult = await csDAO.update(
      coffeeShop._id,
      sessionUserId,
      updateObj
    )

    if (!updateResult.ok)
      errors.updateUser = 'Problem updating the author of this new coffee shop'

    coffeeShop = await csDAO.findById({ id })

    if (Object.keys(errors).length > 0) {
      res.status(400).json(errors)
      return
    }

    // sending user, successful status and response
    res.status(200).json({
      message: 'successfully updated coffeeshop',
      ok: true,
      coffeeshop: coffeeShop,
    })
  }

  static async findById(req, res, next) {
    try {
      let id = req.params.id || ''
      let coffeeshop = await csDAO.findById({
        id,
        populate: ['reviews', 'author'],
      })
      if (!coffeeshop) {
        res.status(404).json({ error: 'Could not find that coffeeshop' })
        return
      }
      res.json({ coffeeshop, ok: true })
    } catch (e) {
      console.log(`api, ${e}`)
      res.status(500).json({ error: e })
    }
  }

  static async delete(req, res, next) {
    let id,
      errors = {}
    try {
      id = req.params.id
    } catch (e) {
      console.error(`no params id, ${e}`)
    }

    // the stored session cookie contains the session _id along with some other stuff (idk why)
    // so we need to extract the session _id from the session cookie
    let sessionUserId = req.get('user')
    let user = await UsersDAO.findById(sessionUserId)
    if (!user) errors.author = 'The author of this coffee shop does not exist'

    if (Object.keys(errors).length > 0) {
      res.status(400).json(errors)
      return
    }

    let deleteResult = await csDAO.delete(id, user._id)

    if (!deleteResult.ok) errors.delete = 'Problem deleting coffee shop'

    if (Object.keys(errors).length > 0) {
      res.status(400).json(errors)
      return
    }

    const updateObj = { $pull: { coffeeShops: ObjectId(id) } }

    let updateUser = await UsersDAO.update(user._id, updateObj)

    if (!updateUser.ok)
      errors.author = 'Problem updating the author of the deleted coffee shop'

    if (Object.keys(errors).length > 0) {
      res.status(400).json(errors)
      return
    }

    // sending successful status and response
    res.status(200).json({
      message: 'successfully delete coffeeshop',
      ok: true,
    })
  }
}

// static async apiGetRandom(req, res, next) {
//   const {shopsList, totalNumShops} = await csDAO.getRandom();
//   let response = {
//     shops = shopsList,
//     total_results: totalNumShops,
//   }
//   res.json(response);
//   return;
// }
