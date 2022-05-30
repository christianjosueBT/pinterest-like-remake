import { Router } from 'express';
import { UserController } from './users.controller.js';

const router = new Router();

router.route('/login').post(UserController.login);
router.route('/register').post(UserController.register);
// router.route('/id/:id').get(UserController.findById);
router.route('/search').get(UserController.search);
// router.route('/delete').get(UserController.delete);

export default router;
