import mongoose from 'mongoose';
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';

/**
 * Report a bug
 */
export const reportBug = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, description } = req.body;

    // Validation
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required',
      });
    }

    // Get user data for snapshot
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create support ticket
    const ticket = await SupportTicket.create({
      userId,
      type: 'bug',
      subject: subject.trim(),
      description: description.trim(),
      status: 'open',
      userData: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        university: user.university,
        userId: user._id.toString(),
      },
    });

    // Send email notification
    try {
      const { sendSupportTicketEmail } = await import('../utils/emailService.js');
      await sendSupportTicketEmail({
        type: 'bug',
        ticketId: ticket._id.toString(),
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userUniversity: user.university,
        subject: ticket.subject,
        description: ticket.description,
      });
      console.log('✅ Bug report email sent');
    } catch (emailError) {
      console.error('❌ Error sending bug report email:', emailError);
      // Don't fail the request if email fails
    }

    console.log('✅ Bug report created:', ticket._id);

    res.status(201).json({
      success: true,
      message: 'Bug report submitted successfully',
      data: {
        ticketId: ticket._id,
        type: ticket.type,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error('❌ Error reporting bug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit bug report',
      error: error.message,
    });
  }
};

/**
 * Report a user
 */
export const reportUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, description, reportedUserId } = req.body;

    // Validation
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required',
      });
    }

    if (!reportedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Reported user ID is required',
      });
    }

    // Get reporter user data
    const reporter = await User.findById(userId);
    if (!reporter) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Try to find reported user - could be ObjectId, email, or username
    let reportedUser = null;
    
    // Check if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(reportedUserId)) {
      reportedUser = await User.findById(reportedUserId);
    }
    
    // If not found by ID, try to find by email
    if (!reportedUser) {
      reportedUser = await User.findOne({ email: reportedUserId.toLowerCase() });
    }
    
    // If still not found, try to find by name (firstName or lastName contains the search term)
    if (!reportedUser) {
      const searchRegex = new RegExp(reportedUserId, 'i');
      reportedUser = await User.findOne({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      });
    }
    
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found. Please provide a valid user ID, email, or name.',
      });
    }

    // Prevent users from reporting themselves
    if (userId.toString() === reportedUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself',
      });
    }

    // Create support ticket
    const ticket = await SupportTicket.create({
      userId,
      type: 'user_report',
      subject: subject.trim(),
      description: description.trim(),
      reportedUserId: reportedUser._id, // Store the actual ObjectId
      status: 'open',
      userData: {
        email: reporter.email,
        firstName: reporter.firstName,
        lastName: reporter.lastName,
        university: reporter.university,
        userId: reporter._id.toString(),
      },
    });

    // Send email notification
    try {
      const { sendSupportTicketEmail } = await import('../utils/emailService.js');
      await sendSupportTicketEmail({
        type: 'user_report',
        ticketId: ticket._id.toString(),
        userEmail: reporter.email,
        userName: `${reporter.firstName} ${reporter.lastName}`,
        userUniversity: reporter.university,
        subject: ticket.subject,
        description: ticket.description,
        reportedUserId: reportedUser._id.toString(),
        reportedUserName: `${reportedUser.firstName} ${reportedUser.lastName}`,
        reportedUserEmail: reportedUser.email,
        reportedUserUniversity: reportedUser.university,
      });
      console.log('✅ User report email sent');
    } catch (emailError) {
      console.error('❌ Error sending user report email:', emailError);
      // Don't fail the request if email fails
    }

    console.log('✅ User report created:', ticket._id);

    res.status(201).json({
      success: true,
      message: 'User report submitted successfully',
      data: {
        ticketId: ticket._id,
        type: ticket.type,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error('❌ Error reporting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit user report',
      error: error.message,
    });
  }
};

