import { Router } from 'express'
import csCtlr from './coffeeshops.controller.js'

const router = new Router()

router.route('/').get(csCtlr.getCoffeeShops)
router.route('/new').post(csCtlr.newCoffeeShop)
router.route('/search').get(csCtlr.searchCoffeeShops)
router.route('/:id').get(csCtlr.findById)
router.route('/:id/update').put(csCtlr.update)
router.route('/:id/delete').delete(csCtlr.delete)

export default router
