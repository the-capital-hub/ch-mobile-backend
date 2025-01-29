import emailjs from "@emailjs/nodejs";

export const sendMail = async (
	from_name,
	to_mail,
	from_mail,
	subject,
	message
) => {
	emailjs.init({
		publicKey: process.env.EMAILJS_PUBLIC_KEY,
		privateKey: process.env.EMAILJS_PRIVATE_KEY,
	});
	const response = await emailjs.send(
		process.env.EMAILJS_SERVICE_ID,
		process.env.EMAILJS_TEMPLATE_ID,
		{
			subject: subject,
			message: message,
			to_mail: to_mail,
			from_name: from_name,
			from_mail: from_mail,
		}
	);
	return response;
};

// Email templates
const getSuccessEmailTemplate = (
	userName,
	webinarTitle,
	webinarDate,
	webinarStartTime,
	meetLink
) => {
	return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #28a745;">Payment Successful! 🎉</h2>
      <p>Dear ${userName},</p>
      
      <p>Thank you for registering for our webinar. Your payment has been successfully processed.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333;">Webinar Details:</h3>
          <p><strong>Title:</strong> ${webinarTitle}</p>
          <p><strong>Date:</strong> ${new Date(
						webinarDate
					).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${webinarStartTime}</p>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32;">Join Webinar Here:</h3>
          <p><a href="${meetLink}" style="color: #2e7d32; text-decoration: underline;">Click here to join the webinar</a></p>
          <p style="font-size: 0.9em; color: #666;">Please save this link. You'll need it to join the webinar on the scheduled date.</p>
      </div>

      <p>Important Notes:</p>
      <ul>
          <li>Join 5 minutes before the scheduled time</li>
          <li>Ensure stable internet connection</li>
          <li>Keep your microphone muted when not speaking</li>
      </ul>

      <p>If you have any questions, feel free to reply to this email.</p>
      
      <p>Best regards,<br>The CapitalHub Team</p>
  </div>
  `;
};

const getFailureEmailTemplate = (userName, webinarTitle, paymentStatus) => {
	return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc3545;">Payment ${paymentStatus} ⚠️</h2>
      <p>Dear ${userName},</p>
      
      <p>We noticed there was an issue with your payment for the webinar registration:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333;">Webinar Details:</h3>
          <p><strong>Title:</strong> ${webinarTitle}</p>
          <p><strong>Payment Status:</strong> ${paymentStatus}</p>
      </div>

      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #856404;">Next Steps:</h3>
          <p>To complete your registration:</p>
          <ol>
              <li>Please try making the payment again</li>
              <li>Ensure your payment details are correct</li>
              <li>Check if your bank has blocked the transaction</li>
          </ol>
      </div>

      <p>If you continue to face issues or need assistance, please contact our support team.</p>
      
      <p>Best regards,<br>The CapitalHub Team</p>
  </div>
  `;
};

// User Registration Success Email Template
const getUserRegistrationTemplate = (
	name,
	email,
	mobile,
	userName,
	password
) => {
	return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #28a745;">Registration Successful! 🎉</h2>
      <p>Dear ${name},</p>
      
      <p>Welcome to CapitalHub! Your account has been successfully created.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333;">Your Account Details:</h3>
          <p><strong>Username:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mobile:</strong> ${mobile}</p>
          <p><strong>Password:</strong> ${password}</p>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32;">Getting Started:</h3>
          <p>You can now log in to your account using your username and password.</p>
          <p style="font-size: 0.9em; color: #666;">We recommend changing your password after your first login.</p>
      </div>

      <p>Best regards,<br>The CapitalHub Team</p>
  </div>
  `;
};

// Priority DM Success Email Template for User
const getPriorityDMSuccessTemplate = (name, email, mobile, amountPaid) => {
	return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #28a745;">Priority DM Sent Successfully! 🎉</h2>
      <p>Dear ${name},</p>
      
      <p>Your priority DM has been successfully sent and payment has been processed.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333;">Transaction Details:</h3>
          <p><strong>Amount Paid:</strong> ${amountPaid}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mobile:</strong> ${mobile}</p>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32;">What's Next?</h3>
          <p>The founder will be notified of your message and will respond as soon as possible.</p>
          <p style="font-size: 0.9em; color: #666;">You'll receive a notification when they respond to your message.</p>
      </div>

      <p>Best regards,<br>The CapitalHub Team</p>
  </div>
  `;
};

// New Priority DM Notification Email Template for Founder
const getFounderPriorityDMTemplate = (userName, userEmail, message) => {
	return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #28a745;">New Priority DM Received! 📫</h2>
      <p>Hello,</p>
      
      <p>You have received a new priority DM from a user on CapitalHub.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333;">Message Details:</h3>
          <p><strong>From:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Message Preview:</strong> ${message.substring(
						0,
						100
					)}...</p>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2e7d32;">Action Required:</h3>
          <p><a href="#" style="color: #2e7d32; text-decoration: underline;">Click here to view and respond to the message</a></p>
          <p style="font-size: 0.9em; color: #666;">This is a priority message. Please respond as soon as possible.</p>
      </div>

      <p>Best regards,<br>The CapitalHub Team</p>
  </div>
  `;
};

// Email template for when founder answers a priority DM
const getPriorityDMAnswerTemplate = (userName, email, mobile, answer) => {
	return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745;">You've Received a Response! 💬</h2>
        <p>Dear ${userName},</p>
        
        <p>Great news! The founder has responded to your priority DM.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333;">Response Details:</h3>
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #28a745; margin: 10px 0;">
                <p style="margin: 0; line-height: 1.6;">${answer}</p>
            </div>
        </div>
  
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2e7d32;">What's Next?</h3>
            <p>You can view this response and your complete conversation history in your dashboard.</p>
            <p><a href="#" style="color: #2e7d32; text-decoration: underline;">Click here to view your dashboard</a></p>
            <p style="font-size: 0.9em; color: #666;">Feel free to send another priority DM if you have more questions.</p>
        </div>
  
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 0.9em; color: #666;">
                <strong>Note:</strong> This email was sent to ${email}. If you didn't request this interaction, please contact our support team.
            </p>
        </div>
  
        <p>Best regards,<br>The CapitalHub Team</p>
    </div>
    `;
};

export {
	getSuccessEmailTemplate,
	getFailureEmailTemplate,
	getUserRegistrationTemplate,
	getPriorityDMSuccessTemplate,
	getFounderPriorityDMTemplate,
	getPriorityDMAnswerTemplate,
};
