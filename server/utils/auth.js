const jwt = require('jsonwebtoken');
const {Types} = require('mongoose')

const secret = 'mysecretsshhhhh';
const expiration = '2h';

module.exports = {
  authMiddleware: function({ req }) {
    // allows token to be sent via req.body, req.query, or headers
    let token = req.body.token || req.query.token || req.headers.authorization;

    // ["Bearer", "<tokenvalue>"]
    if (req.headers.authorization) {
      token = token
        .split(' ')
        .pop()
        .trim();
    }

    if (!token) {
      return req;
    }

    try {
      const { data } = jwt.verify(token, secret, { maxAge: expiration });

      if (Types.ObjectId.isValid(data._id)) {
        req.user = data;
      } else {
        console.log('Invalid ObjectId')
      }
    
    } catch {
      console.log('Invalid token');
    }

    return req;
  },
  signToken: function({ username, studentId, _id, isAdmin }) {
    const payload = { username, studentId, _id, isAdmin };

    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  }
};
