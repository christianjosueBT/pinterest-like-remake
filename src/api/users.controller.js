import { profilePicture } from '../../config.js';
import bcrypt from 'bcryptjs';
import UsersDAO from '../dao/usersDAO.js';

const hashPassword = async password => await bcrypt.hash(password, 10);

export class User {
  constructor({
    _id,
    username,
    email,
    password,
    profilePicture,
    coffeeshops,
    reviews = {},
  } = {}) {
    this._id = _id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.profilePicture = profilePicture;
    this.coffeeshops = coffeeshops;
    this.reviews = reviews;
  }
  async comparePassword(plainText) {
    return await bcrypt.compare(plainText, this.password);
  }
  json() {
    return {
      _id: this._id,
      username: this.username,
      email: this.email,
      profilePicture: this.profilePicture,
      coffeeshops: this.coffeeshops,
      reviews: this.reviews,
    };
  }
}

export class UserController {
  static async register(req, res) {
    try {
      // getting user info from request body and validating the info
      const userFromBody = req.body;
      let errors = {};
      if (userFromBody && userFromBody.password.length < 8) {
        errors.password = 'Your password must be at least 8 characters.';
      }
      if (userFromBody && userFromBody.username.length < 3) {
        errors.username =
          'You must specify a username of at least 3 characters.';
      }
      if (Object.keys(errors).length > 0) {
        res.status(400).json(errors);
        return;
      }
      // generating a user object, inserting it to the database and retrieving the inserted user from the database
      let userInfo = {
        ...userFromBody,
        password: await hashPassword(userFromBody.password),
      };
      if (!('profilePicture' in userInfo))
        userInfo.profilePicture = profilePicture;

      const insertResult = await UsersDAO.addUser(userInfo);
      if (!insertResult.success) {
        errors.email = insertResult.error;
      }
      const userFromDB = await UsersDAO.getUser('email', userFromBody.email);
      if (!userFromDB) {
        errors.general = 'Internal error, please try again later';
      }
      if (Object.keys(errors).length > 0) {
        res.status(400).json(errors);
        return;
      }
      const user = new User(userFromDB);
      // sending user, successful status and response
      res.status(200).json({
        message: 'successfully signed up',
        ok: true,
        user: user.json(),
      });
    } catch (e) {
      res.status(500).json({ error: e });
    }
  }

  static async login(req, res, next) {
    try {
      // getting info from req.body
      const { type, query, password } = req.body;

      // checking email and password are of valid type
      if (
        !type ||
        !query ||
        typeof type !== 'string' ||
        typeof query !== 'string'
      ) {
        res
          .status(400)
          .json({ error: 'Bad type or query format, expected string' });
        return;
      }

      if (!password || typeof password !== 'string') {
        res
          .status(400)
          .json({ error: 'Bad password format, expected string.' });
        return;
      }

      // fetching user data and making a new user object
      let userData = await UsersDAO.getUser(type, query);
      if (!userData) {
        res.status(401).json({ error: 'Incorrect username or email' });
        return;
      }
      const user = new User(userData);

      // checking password
      if (!(await user.comparePassword(password))) {
        res.status(401).json({ error: 'Incorrect password' });
        return;
      }

      // sending user authorization cookie, refresh cookie, and successful status and response
      res.status(200).json({
        message: 'successfully logged in',
        ok: true,
        user: user.json(),
      });
      return;
    } catch (e) {
      res.status(400).json({ error: e });
      return;
    }
  }

  static async search(req, res, next) {
    try {
      let type = req.query.type;
      let query = req.query.query;
      // checking email and password are of valid type
      if (!type || !query || type === '' || query === '') {
        res
          .status(400)
          .json({ error: 'Bad query format, expected type and query.' });
        return;
      }
      // fetching user data and making a new user object
      let userData = await UsersDAO.getUser(type, query);
      if (!userData) {
        res.status(401).json({
          error:
            'Could not find a user with the specified type and query parameters',
        });
        return;
      }
      const user = new User(userData);

      // sending user authorization cookie, refresh cookie, and successful status and response
      return res.status(200).json({
        message: 'successfully found a user',
        ok: true,
        user: user.json(),
      });
    } catch (e) {
      res.status(400).json({ error: e });
      return;
    }
  }

  static async findById(req, res, next) {
    try {
      let id = req.params.id || '';
      let user = await UsersDAO.findById(id);
      if (!user) {
        res.status(404).json({ error: 'Could not find that user' });
        return;
      }
      res.json({ user, ok: true });
    } catch (e) {
      console.log(`Problem getting a user with that id, ${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async delete(req, res) {
    try {
      const userJwt = req.cookies.Authorization.slice('Bearer%20'.length);
      const token = req.cookies.Refresh;
      let { password } = req.body;
      let refreshObj = { token };
      if (!password || typeof password !== 'string') {
        res
          .status(400)
          .json({ error: 'Bad password format, expected string.' });
        return;
      }
      const userClaim = await User.decoded(userJwt);
      var { error } = userClaim;
      if (error) {
        res.status(401).json({ error });
        return;
      }
      const user = new User(await UsersDAO.getUser(userClaim.email));
      if (!(await user.comparePassword(password))) {
        res.status(401).json({ error: 'Make sure your password is correct.' });
        return;
      }
      const deleteResult = await UsersDAO.deleteUser(
        userClaim.email,
        refreshObj
      );
      var { error } = deleteResult;
      if (error) {
        res.status(500).json({ error });
        return;
      }

      res
        .clearCookie('Authorization', {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
        })
        .clearCookie('Refresh', {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
          path: '/api/v1/users',
        })
        .status(200)
        .json({ deleteResult, ok: true });
    } catch (e) {
      res.status(500).json(e);
    }
  }
}
