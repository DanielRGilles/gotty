const { Router } = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');

const UserService = require('../services/UserService');
const ONE_DAY = 1000 * 60 * 60 * 24;

module.exports = Router()
  .get('/login', async (req, res) => {
    // TODO: Kick-off the github oauth flow
    res.redirect(
      `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&scope=user&redirect_uri=${process.env.REDIRECT_URI}&scope=user`
    );
  })
  .get('/login/callback', async (req, res, next) => {
    //  TODO:
    try {
      // get code
     
      const user = await UserService.create(req.query.code); 
      // * create jwt
      //  * set cookie and redirect
      res
        .cookie('session', sign(user), {
          httpOnly: true,
          maxAge: ONE_DAY,
        })
        .redirect('/api/v1/github/dashboard');
        
    } catch (error) {
      next(error);
    }
      
  })
  .get('/dashboard', authenticate, async (req, res) => {
    // require req.user

    // get data about user and send it as json
    res.json(req.user);
  })
  .delete('/sessions', (req, res) => {
    res
      .clearCookie(process.env.COOKIE_NAME)
      .json({ success: true, message: 'Signed out successfully!' });
  });


const sign = (payload) => {
  return jwt.sign({ ...payload }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};
