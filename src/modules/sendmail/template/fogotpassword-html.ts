export const ForgotTemplate = (otp: string) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forget Password OTP</title>
    </head>
    <body>
        <div style="font-family: Arial, sans-serif; margin: 0 auto; max-width: 600px; padding: 20px;">
            <h2 style="color: #333;">Forget Password OTP</h2>
            <p>Hello,</p>
            <p>We received a request to change password your email. Please use the following OTP (One Time Password) to confirm the change:</p>
            <div style="display: flex; justify-content: center; align-items: center">
             <h3 style="color: red; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">${otp}</h3>
            </div>
            <p>If you did not request to change your email, you can ignore this email and your email address will remain unchanged.</p>
            <p>Thank you,</p>
            <p>Zen-s Team</p>
        </div>
    </body>
    </html>`;
};
