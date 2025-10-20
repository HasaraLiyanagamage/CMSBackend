import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Auth middleware - token present:', !!token);
  if (!token) {
    console.log('Auth middleware - no token, returning 401');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(token, 'mysecret');
    console.log('Auth middleware - token verified, role:', req.user.role);
    next();
  } catch (err) {
    console.error('Auth middleware - token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/', auth, (req, res) => {
  console.log('Route handler called for role:', req.user.role);
  res.json({ message: 'Success' });
});

const app = express();
app.use('/api/customers', router);

const server = app.listen(5007, () => {
  console.log('Auth test server on 5007');
});

export default server;
