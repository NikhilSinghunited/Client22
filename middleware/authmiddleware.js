const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'adminpassword',
    role: 'admin',
  },
  {
    id: 2,
    username: 'user',
    password: 'password',
    role: 'user',
  },
];

const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token)
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Check if the user exists and has admin role
    const user = users.find((u) => u.id === req.user.id && u.role === 'admin');
    if (!user)
      return res.status(403).json({ message: 'Access denied. Admins only.' });

    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};
module.exports = authenticateAdmin;
