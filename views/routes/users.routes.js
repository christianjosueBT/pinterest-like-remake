import { Router } from 'express';
import fetch from 'node-fetch';
import { requireLogin } from '../../middleware/users.js';
const router = new Router();

// router.get('/user/:id', async (req, res) => {
//   const userProfile = await User.findById(req.params.id).populate({
//     path: 'reviews',
//     populate: { path: 'coffeeshop', select: 'images name' },
//   });
//   res.render('users/user.ejs', { userProfile });
// });

// router.get('/register', (req, res) => {
//   res.render('users/register.ejs');
// });

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  let result = await fetch(`http://${req.get('host')}/api/v1/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      username,
      password,
    }),
  });

  result = await result.json();

  if (!result.ok)
    return res.status(400).json({ error: 'problem with registration' });
  req.session.user = result.user;
  res.redirect('/coffeeShops');
});

router.get('/login', (req, res) => {
  if (Object.keys(req.query).length !== 0 && 'isLoggedIn' in req.query) {
    if (req.session.user && Object.keys(req.session.user).length > 0) {
      return res.json(req.session.user);
    } else {
      return res.json({});
    }
  } else return res.render('users/login.ejs');
});

router.post('/login', async (req, res) => {
  const { query, password } = req.body;
  let result, type;
  if (query) query.includes('@') ? (type = 'email') : (type = 'username');
  else
    return res
      .status(400)
      .json({ error: 'you must provide a valid email or username' });

  result = await fetch(`http://${req.get('host')}/api/v1/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      query,
      password,
    }),
  });
  result = await result.json();

  if (!result.ok) {
    console.error('problem logging in', result);
    return res.status(400).json({ error: 'problem logging in' });
  }
  if (result && Object.keys(result).length > 0) {
    req.session.user = result.user;
    res.redirect('/coffeeShops')
  } else {
    res.status(400).json({ error: 'problem logging in' });
  }
});

router.post('/logout', requireLogin, (req, res) => {
  try {
    req.session.destroy();
  } catch (err) {
    console.error('problem logging out', err);
    res.redirect('/coffeeShops')
  }
  res.redirect('/coffeeShops')
});

export default router;
