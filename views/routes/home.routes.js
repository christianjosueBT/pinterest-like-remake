import { Router } from 'express'
import fetch from 'node-fetch'
import multer from 'multer'

import { requireLogin, isAllowed } from '../../middleware/users.js'
import { storage } from '../../cloudinary/index.js'

const router = new Router()
const upload = multer({ storage })

router.route('/').get(async (req, res) => {
  try {
    let shops = await fetch(
      `http://${req.get(
        'host'
      )}/api/v1/coffeeshops?entries=2&project=_id,images`
    )
    shops = await shops.json()
    shops = shops.shops
    res.render('home.ejs', { shops })
  } catch (err) {
    console.error('error in side home.routes', err)
  }
})

router.route('/coffeeShops').get(async (req, res) => {
  let shops
  try {
    if (Object.keys(req.query).length > 0) {
      // checking if this is a search query
      if (req.query.search && req.query.search !== '') {
        shops = await fetch(
          `http://${req.get('host')}/api/v1/coffeeshops/search?type=name&name=${
            req.query.search
          }&project=images,name&rating=true`
        )
      }
      // this is not a search query, but there are other query parameters
      else {
        let str = `http://${req.get('host')}/api/v1/coffeeshops?`
        for (const el of Object.keys(req.query)) {
          str += `${el}=${req.query[el]}&`
        }
        str = str.substr(0, str.length - 1)
        shops = await fetch(str)
        shops = await shops.text()
        shops = JSON.parse(shops).shops
        return res.send(shops)
      }
    } else {
      shops = await fetch(
        `http://${req.get(
          'host'
        )}/api/v1/coffeeshops?project=images,name&rating=true`
      )
    }
    shops = await shops.json()
    shops = shops.shops
  } catch (e) {
    console.error('Problem fetching coffee shops', e.message)
  }

  res.render('coffeeShops/index.ejs', { shops })
  return
})

// render 'make a new coffeeshop' form
router
  .route('/coffeeShops/new')
  .get(requireLogin, (req, res) => {
    res.render('coffeeshops/new.ejs')
    return
  })
  .post(requireLogin, upload.array('coffeeshop[images]'), async (req, res) => {
    let files = {}

    if (req.files && req.files.length > 0)
      files = req.files.map(f => ({
        url: f.path,
        filename: f.filename.substring(f.filename.indexOf('/') + 1),
      }))

    const coffeeShop = {
      author: req.session.user._id,
      name: req.body.coffeeshop.name,
      price: req.body.coffeeshop.price,
      images: files,
    }

    let result = await fetch(
      `http://${req.get('host')}/api/v1/coffeeshops/new`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coffeeShop),
      }
    )

    result = await result.json()
    if (!result.ok)
      return res.status(400).json({
        message: 'problem making a new coffeeshop ☹️☹️☹️',
        error: result,
      })

    let coffeeshop = result.coffeeshop

    res.redirect(`/coffeeshops/${coffeeshop._id}`)

    // res.json({ files, body: req.body });
  })

router
  .route('/coffeeShops/:id')
  .get(async (req, res) => {
    let coffeeShop,
      result,
      id = req.params.id
    try {
      result = await fetch(`http://${req.get('host')}/api/v1/coffeeshops/${id}`)
      coffeeShop = await result.json()
      coffeeShop = coffeeShop.coffeeshop
      // if (!result.ok) return res.render('coffeeShops/notFound.ejs');
    } catch (e) {
      console.error('error fetching coffeeshop with that id')
    }

    res.render('coffeeshops/showPage.ejs', { coffeeShop })
    return
  })
  .put(
    requireLogin,
    isAllowed,
    upload.array('coffeeshop[images]'),
    async (req, res) => {
      let files = {}
      const { id } = req.params

      console.log('req.files from home routes:', req.files)
      // if there are images in the request, we change them to a valid format to upload to our database
      if (req.files && req.files.length > 0)
        files = req.files.map(f => ({
          url: f.path,
          filename: f.filename.substring(f.filename.indexOf('/') + 1),
        }))

      // creating the body we will send to the update route
      let coffeeShop = {
        name: req.body.coffeeshop.name,
        price: req.body.coffeeshop.price,
        images: files,
      }

      console.log('update object from home routes :id update route', coffeeShop)
      // sending a put request to the update route
      let result = await fetch(
        `http://${req.get('host')}/api/v1/coffeeshops/${id}/update?_method=PUT`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            user: req.session.user._id,
          },
          body: JSON.stringify(coffeeShop),
        }
      )

      result = await result.json()
      if (!result.ok)
        return res.status(400).json({
          message: 'problem updating the coffeeshop ☹️☹️☹️',
          error: result,
        })

      let coffeeshop = result.coffeeshop
      console.log('update result from home routes :id update route', coffeeshop)

      res.redirect(`/coffeeShops/${coffeeshop._id}`)
    }
  )
  .delete(requireLogin, isAllowed, async (req, res) => {
    const { id } = req.params
    // sending a delete  request to the api delete route
    let result = await fetch(
      `http://${req.get(
        'host'
      )}/api/v1/coffeeshops/${id}/delete?_method=DELETE`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          user: req.session.user._id,
        },
      }
    )

    result = await result.json()

    if (!result.ok)
      return res.status(400).json({
        message: 'problem deleting  the coffeeshop ☹️☹️☹️',
        error: result.message,
      })

    res.redirect(`/coffeeShops`)
  })

router
  .route('/coffeeShops/:id/reviews')
  .get(async (req, res) => {
    // let coffeeShop,
    //   result,
    //   id = req.params.id
    // try {
    //   result = await fetch(`http://${req.get('host')}/api/v1/coffeeshops/${id}`)
    //   coffeeShop = await result.json()
    //   coffeeShop = coffeeShop.coffeeshop
    //   // if (!result.ok) return res.render('coffeeShops/notFound.ejs');
    // } catch (e) {
    //   console.error('error fetching coffeeshop with that id')
    // }
    // res.render('coffeeshops/showPage.ejs', { coffeeShop })
    res.json({ reminder: 'I should make a get reviews page' })
  })
  .post(requireLogin, async (req, res) => {
    const { id } = req.params

    const reviewInfo = {
      author: req.session.user._id,
      body: req.body.review.body,
      coffeeShop: id,
      rating: parseInt(req.body.review.rating, 10),
    }

    let result = await fetch(
      `http://${req.get('host')}/api/v1/coffeeshops/${id}/reviews`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewInfo),
      }
    )

    result = await result.json()
    if (!result.ok)
      return res.status(400).json({
        message: 'problem making a new coffeeshop ☹️☹️☹️',
        error: result,
      })

    let review = result.review

    res.redirect(`/coffeeshops/${id}`)
  })
  .delete(requireLogin, isAllowed, async (req, res) => {
    const { id } = req.params
    // sending a delete  request to the api delete route
    let result = await fetch(
      `http://${req.get(
        'host'
      )}/api/v1/coffeeshops/${id}/delete?_method=DELETE`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          user: req.session.user._id,
        },
      }
    )

    result = await result.json()

    if (!result.ok)
      return res.status(400).json({
        message: 'problem deleting  the coffeeshop ☹️☹️☹️',
        error: result.message,
      })

    res.redirect(`/coffeeShops`)
  })

router
  .route('/coffeeshops/:id/edit')
  .get(requireLogin, isAllowed, async (req, res) => {
    let coffeeShop,
      result,
      id = req.params.id
    try {
      result = await fetch(`http://${req.get('host')}/api/v1/coffeeshops/${id}`)
      coffeeShop = await result.json()
      coffeeShop = coffeeShop.coffeeshop
    } catch (e) {
      console.error('error fetching coffeeshop with that id')
    }

    return res.render('coffeeshops/edit.ejs', { coffeeShop })
  })

export default router
