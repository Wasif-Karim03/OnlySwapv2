import Report from '../models/Report.js';
import logger from '../utils/logger.js';

// Create a new report
export const createReport = async (req, res) => {
    try {
        const { reportedUser, reportedProduct, reason, description } = req.body;
        const reporter = req.user.userId;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required',
            });
        }

        if (!reportedUser && !reportedProduct) {
            return res.status(400).json({
                success: false,
                message: 'Must report either a user or a product',
            });
        }

        const report = new Report({
            reporter,
            reportedUser,
            reportedProduct,
            reason,
            description,
        });

        await report.save();

        logger.info(`🚩 New report created by ${reporter} against ${reportedUser || reportedProduct}`);

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully. We will review it shortly.',
            data: report,
        });
    } catch (error) {
        logger.error('Error creating report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report',
            error: error.message,
        });
    }
};
