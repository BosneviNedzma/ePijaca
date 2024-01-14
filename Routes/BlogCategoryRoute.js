const express = require('express');
const { createCategory, updateCategory, deleteCategory, getCategory, getAllCategories } = require('../Controllers/BlogCategoryController');
const { authMiddleware, isAdmin } = require('../Middlewares/AuthMiddleware');
const router = express.Router();

router.post('/', authMiddleware, isAdmin, createCategory);
router.put('/:id', authMiddleware, isAdmin, updateCategory);
router.delete('/:id', authMiddleware, isAdmin, deleteCategory);
router.get('/:id', getCategory);
router.get('/', getAllCategories);

module.exports = router;