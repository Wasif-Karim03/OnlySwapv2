import User from '../models/User.js';
import logger from '../utils/logger.js';

// Block a user
export const blockUser = async (req, res) => {
    try {
        const { userId } = req.body; // The user to block
        const requesterId = req.user.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID to block is required',
            });
        }

        if (userId === requesterId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot block yourself',
            });
        }

        // Add to blockedUsers array if not already present
        await User.findByIdAndUpdate(requesterId, {
            $addToSet: { blockedUsers: userId },
        });

        logger.info(`🚫 User ${requesterId} blocked user ${userId}`);

        res.status(200).json({
            success: true,
            message: 'User blocked successfully',
        });
    } catch (error) {
        logger.error('Error blocking user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to block user',
            error: error.message,
        });
    }
};

// Unblock a user
export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params; // The user to unblock
        const requesterId = req.user.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID to unblock is required',
            });
        }

        // Remove from blockedUsers array
        await User.findByIdAndUpdate(requesterId, {
            $pull: { blockedUsers: userId },
        });

        logger.info(`✅ User ${requesterId} unblocked user ${userId}`);

        res.status(200).json({
            success: true,
            message: 'User unblocked successfully',
        });
    } catch (error) {
        logger.error('Error unblocking user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unblock user',
            error: error.message,
        });
    }
};

// Get list of blocked users
export const getBlockedUsers = async (req, res) => {
    try {
        const requesterId = req.user.userId;

        const user = await User.findById(requesterId).populate('blockedUsers', 'firstName lastName profilePicture');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            blockedUsers: user.blockedUsers,
        });
    } catch (error) {
        logger.error('Error fetching blocked users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blocked users',
            error: error.message,
        });
    }
};
