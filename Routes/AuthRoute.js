const express = require('express');
const { createUser, loginUserController,
     getAllUsers, getaUser, 
     deleteaUser, updateaUser,
     blockUser,  unblockUser,
     handleRefreshToken, logout,
     updatePassword, forgotPasswordToken,
     resetPassword, 
} = require('../Controllers/UserController');
const {authMiddleware, isAdmin} = require('../Middlewares/AuthMiddleware');
const router = express.Router();
router.post('/register', createUser);
router.post('/forgot-password-token', forgotPasswordToken);
router.put('/reset-password/:token', resetPassword);

router.put('/password', authMiddleware, updatePassword);
router.post('/login', loginUserController);
router.get('/all-users', getAllUsers);
router.get('/refresh', handleRefreshToken);
router.get("/logout", logout);
router.get('/:id', authMiddleware, isAdmin, getaUser);
router.delete('/:id', deleteaUser);
router.put('/edit-user', authMiddleware, updateaUser);
router.put('/block-user/:id', authMiddleware, isAdmin, blockUser);
router.put('/unblock-user/:id', authMiddleware, isAdmin, unblockUser);

module.exports = router;
