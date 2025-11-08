const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');

// all routes protected by admin
router.use(auth);

// CRUD
router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
