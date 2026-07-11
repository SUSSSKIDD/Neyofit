import { EmailTemplate } from './emailTemplates.model';
import logger from '@/utils/logger';

const templates = [
    {
        templateType: 'welcome-email',
        name: 'Welcome Email',
        description: 'Sent to new users after registration',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333;">Welcome to Neyofit, <%= userName %>!</h1>
                <p>Thank you for joining Neyofit. We're excited to help you discover and subscribe to the best gyms near you.</p>
                <p>Get started by browsing gyms in your area:</p>
                <a href="<%= loginUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Explore Gyms
                </a>
                <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'loginUrl' }
        ],
        defaultData: {
            userName: 'there',
            loginUrl: 'http://localhost:3000/login'
        }
    },
    {
        templateType: 'email-verification',
        name: 'Email Verification',
        description: 'Sent when a user requests email verification',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333;">Verify Your Email</h1>
                <p>Hi <%= userName %>,</p>
                <p>Please click the button below to verify your email address:</p>
                <a href="<%= verifyUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Verify Email
                </a>
                <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'verifyUrl' }
        ],
        defaultData: {
            userName: 'there'
        }
    },
    {
        templateType: 'password-reset',
        name: 'Password Reset',
        description: 'Sent when a user requests a password reset',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333;">Reset Your Password</h1>
                <p>Hi <%= userName %>,</p>
                <p>You requested a password reset. Click the button below to set a new password:</p>
                <a href="<%= resetUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Reset Password
                </a>
                <p style="color: #666; font-size: 14px;">This link expires in <%= expiryTime %>. If you didn't request this, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'resetUrl' },
            { variable: 'expiryTime' }
        ],
        defaultData: {
            userName: 'there',
            expiryTime: '1 hour'
        }
    },
    {
        templateType: 'subscription-reminder',
        name: 'Subscription Expiry Reminder',
        description: 'Sent when a subscription is about to expire',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333;">Subscription Expiring Soon</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your subscription at <strong><%= gymName %></strong> will expire in <strong><%= daysRemaining %> day(s)</strong> on <%= expiryDate %>.</p>
                <p>Renew now to keep your access:</p>
                <a href="<%= renewUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Renew Subscription
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'gymName' },
            { variable: 'expiryDate' },
            { variable: 'daysRemaining' },
            { variable: 'renewUrl' }
        ],
        defaultData: {
            userName: 'there',
            gymName: 'your gym',
            daysRemaining: '7'
        }
    },
    {
        templateType: 'gym-approved',
        name: 'Gym Approved Notification',
        description: 'Sent to gym owner when their gym is approved',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10B981;">Your Gym Has Been Approved!</h1>
                <p>Hi <%= userName %>,</p>
                <p>Great news! Your gym <strong><%= gymName %></strong> has been approved and is now live on Neyofit.</p>
                <p>Customers can now discover and subscribe to your gym.</p>
                <a href="<%= dashboardUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Go to Dashboard
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'gymName' },
            { variable: 'dashboardUrl' }
        ],
        defaultData: {
            userName: 'there',
            dashboardUrl: 'http://localhost:3000/gym-owner/dashboard'
        }
    },
    {
        templateType: 'subscription-confirmation',
        name: 'Subscription Confirmation',
        description: 'Sent after successful subscription purchase',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10B981;">Subscription Confirmed!</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your subscription to <strong><%= gymName %></strong> has been confirmed.</p>
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Plan:</strong> <%= planName %></p>
                    <p><strong>Duration:</strong> <%= duration %></p>
                    <p><strong>Start Date:</strong> <%= startDate %></p>
                    <p><strong>End Date:</strong> <%= endDate %></p>
                </div>
                <a href="<%= dashboardUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    View My Subscriptions
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'gymName' },
            { variable: 'planName' },
            { variable: 'duration' },
            { variable: 'startDate' },
            { variable: 'endDate' },
            { variable: 'dashboardUrl' }
        ],
        defaultData: {
            userName: 'there',
            dashboardUrl: 'http://localhost:3000/dashboard'
        }
    },
    {
        templateType: 'password-changed',
        name: 'Password Changed Notification',
        description: 'Sent after a successful password reset',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #EF4444;">Password Changed</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your password was successfully changed on <strong><%= changeTime %></strong>.</p>
                <p>If you did not make this change, please secure your account immediately:</p>
                <a href="<%= loginUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Secure My Account
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'loginUrl' },
            { variable: 'changeTime' }
        ],
        defaultData: {
            userName: 'there',
            loginUrl: 'http://localhost:3000/login',
            changeTime: new Date().toISOString()
        }
    },
    {
        templateType: 'account-suspended',
        name: 'Account Suspended',
        description: 'Sent when an admin deactivates a user account',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #EF4444;">Account Suspended</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your Neyofit account has been suspended. You will not be able to log in until it is reactivated.</p>
                <p>If you believe this is an error, please contact our support team at <strong><%= supportEmail %></strong>.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'supportEmail' }
        ],
        defaultData: {
            userName: 'there',
            supportEmail: 'support@Neyofit.com'
        }
    },
    {
        templateType: 'account-reactivated',
        name: 'Account Reactivated',
        description: 'Sent when an admin reactivates a user account',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10B981;">Account Reactivated</h1>
                <p>Hi <%= userName %>,</p>
                <p>Great news! Your Neyofit account has been reactivated. You can now log in and use the platform again.</p>
                <a href="<%= loginUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Log In Now
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'loginUrl' }
        ],
        defaultData: {
            userName: 'there',
            loginUrl: 'http://localhost:3000/login'
        }
    },
    {
        templateType: 'account-deleted',
        name: 'Account Deleted',
        description: 'Sent when an admin deletes a user account',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #EF4444;">Account Deleted</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your Neyofit account has been permanently deleted. All your data has been removed from our platform.</p>
                <p>If you believe this was a mistake, please contact us as soon as possible.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' }
        ],
        defaultData: {
            userName: 'there'
        }
    },
    {
        templateType: 'email-verified-success',
        name: 'Email Verified Successfully',
        description: 'Sent after email verification is completed',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10B981;">Email Verified!</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your email address has been successfully verified. You now have full access to all Neyofit features.</p>
                <a href="<%= dashboardUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Go to Dashboard
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'dashboardUrl' }
        ],
        defaultData: {
            userName: 'there',
            dashboardUrl: 'http://localhost:3000/dashboard'
        }
    },
    {
        templateType: 'gym-status-changed',
        name: 'Gym Status Changed',
        description: 'Sent when gym status changes to archived or draft',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #F59E0B;">Gym Status Updated</h1>
                <p>Hi <%= userName %>,</p>
                <p>The status of your gym <strong><%= gymName %></strong> has been changed to <strong><%= newStatus %></strong>.</p>
                <a href="<%= dashboardUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    View Dashboard
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'gymName' },
            { variable: 'newStatus' },
            { variable: 'dashboardUrl' }
        ],
        defaultData: {
            userName: 'there',
            dashboardUrl: 'http://localhost:3000/gym-owner/dashboard'
        }
    },
    {
        templateType: 'gym-deleted',
        name: 'Gym Deleted Notification',
        description: 'Sent when a gym is removed from the platform',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #EF4444;">Gym Removed</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your gym <strong><%= gymName %></strong> has been removed from the Neyofit platform along with all associated data.</p>
                <a href="<%= dashboardUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    Go to Dashboard
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'gymName' },
            { variable: 'dashboardUrl' }
        ],
        defaultData: {
            userName: 'there',
            dashboardUrl: 'http://localhost:3000/gym-owner/dashboard'
        }
    },
    {
        templateType: 'bank-details-updated',
        name: 'Bank Details Updated',
        description: 'Sent when gym owner updates bank information',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4F46E5;">Bank Details Updated</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your bank details have been successfully updated:</p>
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Bank:</strong> <%= bankName %></p>
                    <p><strong>Account:</strong> <%= maskedAccountNumber %></p>
                </div>
                <p style="color: #666; font-size: 14px;">If you did not make this change, please contact support immediately.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'bankName' },
            { variable: 'maskedAccountNumber' }
        ],
        defaultData: {
            userName: 'there',
            bankName: 'Your Bank',
            maskedAccountNumber: '****1234'
        }
    },
    {
        templateType: 'commission-rate-changed',
        name: 'Commission Rate Changed',
        description: 'Sent when superadmin changes gym commission rate',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4F46E5;">Commission Rate Updated</h1>
                <p>Hi <%= userName %>,</p>
                <p>The commission rate for your gym <strong><%= gymName %></strong> has been updated:</p>
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Previous Rate:</strong> <%= oldRate %>%</p>
                    <p><strong>New Rate:</strong> <%= newRate %>%</p>
                </div>
                <a href="<%= dashboardUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    View Dashboard
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'gymName' },
            { variable: 'oldRate' },
            { variable: 'newRate' },
            { variable: 'dashboardUrl' }
        ],
        defaultData: {
            userName: 'there',
            dashboardUrl: 'http://localhost:3000/gym-owner/dashboard'
        }
    },
    {
        templateType: 'new-gym-review',
        name: 'New Gym Review',
        description: 'Sent to gym owner when a customer submits a review',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4F46E5;">New Review for Your Gym</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your gym <strong><%= gymName %></strong> just received a new review!</p>
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Reviewer:</strong> <%= reviewerName %></p>
                    <p><strong>Rating:</strong> <%= rating %>/5</p>
                    <p><strong>Comment:</strong> <%= comment %></p>
                </div>
                <a href="<%= dashboardUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    View All Reviews
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'gymName' },
            { variable: 'reviewerName' },
            { variable: 'rating' },
            { variable: 'comment' },
            { variable: 'dashboardUrl' }
        ],
        defaultData: {
            userName: 'there',
            dashboardUrl: 'http://localhost:3000/gym-owner/dashboard'
        }
    },
    {
        templateType: 'payout-initiated',
        name: 'Payout Initiated',
        description: 'Sent when a payout is created for a gym owner',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4F46E5;">Payout Initiated</h1>
                <p>Hi <%= userName %>,</p>
                <p>A payout has been initiated for your account:</p>
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Amount:</strong> <%= currency %> <%= payoutAmount %></p>
                    <p><strong>Payments Included:</strong> <%= paymentCount %></p>
                    <p><strong>Period:</strong> <%= periodStart %> - <%= periodEnd %></p>
                </div>
                <p style="color: #666; font-size: 14px;">You will be notified once the payout is processed.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'payoutAmount' },
            { variable: 'currency' },
            { variable: 'paymentCount' },
            { variable: 'periodStart' },
            { variable: 'periodEnd' }
        ],
        defaultData: {
            userName: 'there',
            currency: 'INR'
        }
    },
    {
        templateType: 'payout-completed',
        name: 'Payout Completed',
        description: 'Sent when a payout is successfully completed',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10B981;">Payout Completed!</h1>
                <p>Hi <%= userName %>,</p>
                <p>Your payout has been successfully processed:</p>
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Amount:</strong> <%= currency %> <%= payoutAmount %></p>
                    <p><strong>Transaction Reference:</strong> <%= transactionReference %></p>
                </div>
                <a href="<%= dashboardUrl %>" style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                    View Payout History
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'payoutAmount' },
            { variable: 'currency' },
            { variable: 'transactionReference' },
            { variable: 'dashboardUrl' }
        ],
        defaultData: {
            userName: 'there',
            currency: 'INR',
            dashboardUrl: 'http://localhost:3000/gym-owner/dashboard'
        }
    },
    {
        templateType: 'otp-verification',
        name: 'OTP Verification',
        description: 'Sent when a user requests an OTP for login or signup',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333;">Your Verification Code</h1>
                <p>Hi <%= userName %>,</p>
                <p>Use the following code to verify your identity:</p>
                <div style="background: #F9FAFB; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;"><%= otpCode %></span>
                </div>
                <p style="color: #666; font-size: 14px;">This code expires in <strong>10 minutes</strong>. If you didn't request this code, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'otpCode' }
        ],
        defaultData: {
            userName: 'there',
            otpCode: '000000'
        }
    },
    {
        templateType: 'payout-failed',
        name: 'Payout Failed',
        description: 'Sent when a payout fails',
        providerName: 'default',
        isActive: true,
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #EF4444;">Payout Failed</h1>
                <p>Hi <%= userName %>,</p>
                <p>Unfortunately, your payout of <strong><%= currency %> <%= payoutAmount %></strong> could not be processed.</p>
                <p>The amount will be included in your next payout cycle. If you have questions, please contact us at <strong><%= supportEmail %></strong>.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px;">Neyofit - Your Gym Discovery Platform</p>
            </div>
        `,
        variables: [
            { variable: 'userName' },
            { variable: 'payoutAmount' },
            { variable: 'currency' },
            { variable: 'supportEmail' }
        ],
        defaultData: {
            userName: 'there',
            currency: 'INR',
            supportEmail: 'support@Neyofit.com'
        }
    }
];

export const seedEmailTemplates = async (): Promise<void> => {
    try {
        for (const template of templates) {
            const existing = await EmailTemplate.findOne({ templateType: template.templateType });
            if (!existing) {
                await EmailTemplate.create(template);
                logger.info(`Seeded email template: ${template.templateType}`);
            }
        }
        logger.info('Email template seeding complete');
    } catch (error) {
        logger.error('Failed to seed email templates', error as Error);
    }
};
