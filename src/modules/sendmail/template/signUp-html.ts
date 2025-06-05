export const SignUpTemplate = (otp: string) => {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Email</title>
    </head>
    <body>
        <div style="font-family: Arial, sans-serif; margin: 0 auto; max-width: 600px; padding: 20px;">
            <h2 style="color: #333;">Verify Email</h2>
            <p>Hello,</p>
            <p>We received a request to sign up account your email. Please use the following OTP to confirm:</p>
            <div style="display: flex; justify-content: center; align-items: center">
             <h3 style="color: red; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">${otp}</h3>
            </div>
            <p>Thank you,</p>
            <p>Zen-s team</p>
        </div>
    </body>
    </html>`;
};
