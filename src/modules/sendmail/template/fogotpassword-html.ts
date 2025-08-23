export const ForgotTemplate = (url: string) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forget Password</title>
    </head>
    <body>
        <div style="font-family: Arial, sans-serif; margin: 0 auto; max-width: 600px; padding: 20px;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your account. Please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${url}" target="_blank" 
                 style="background-color: #4CAF50; color: white; padding: 12px 20px; 
                        text-decoration: none; border-radius: 5px; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p>If the button does not work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all;"><a href="${url}">${url}</a></p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <p>Thank you,<br/>MeetLyzer</p>
        </div>
    </body>
    </html>`;
};
