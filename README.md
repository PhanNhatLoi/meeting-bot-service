<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Meeting Bot Service

## Ngrok Integration

This project includes integrated ngrok support for exposing your local development server to the internet.

### Setup

1. **Install ngrok** (if not already installed):

   ```bash
   npm install ngrok
   ```

2. **Configure environment variables**:
   Copy the configuration from `ngrok-config.example` to your `.env` file:

   ```bash
   # Enable/disable ngrok tunnel
   NGROK_ENABLED=true

   # Your ngrok auth token (get from https://dashboard.ngrok.com/get-started/your-authtoken)
   NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

   # Ngrok region (us, eu, au, ap, sa, jp, in)
   NGROK_REGION=us

   # Protocol (http, https, tcp)
   NGROK_PROTO=http
   ```

3. **Get your ngrok auth token**:
   - Sign up at [ngrok.com](https://ngrok.com)
   - Go to [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
   - Copy your auth token and add it to `.env`

### Usage

#### Automatic Tunnel Creation

When you start the application, ngrok will automatically create a tunnel if `NGROK_ENABLED=true`:

```bash
npm run start:dev
```

You'll see output like:

```
✅ Ngrok tunnel started successfully!
🌐 Public URL: https://abc123.ngrok.io
🔗 Local URL: http://localhost:3000
```

#### Manual Control via API

You can also control the ngrok tunnel via REST API:

- **Get tunnel status**: `GET /api/v1/ngrok/status`
- **Start tunnel**: `POST /api/v1/ngrok/start`
- **Stop tunnel**: `DELETE /api/v1/ngrok/stop`

#### Testing

Test ngrok connection:

```bash
node scripts/test-ngrok.js
```

### Features

- ✅ Automatic tunnel creation on app startup
- ✅ Configurable via environment variables
- ✅ REST API for manual control
- ✅ Automatic cleanup on app shutdown
- ✅ Beautiful console logging with emojis
- ✅ Swagger documentation for API endpoints

### Configuration Options

| Variable           | Description           | Default |
| ------------------ | --------------------- | ------- |
| `NGROK_ENABLED`    | Enable/disable ngrok  | `false` |
| `NGROK_AUTH_TOKEN` | Your ngrok auth token | -       |
| `NGROK_REGION`     | Ngrok region          | `us`    |
| `NGROK_PROTO`      | Protocol              | `http`  |

### Troubleshooting

1. **"Failed to start ngrok tunnel"**:

   - Check if your auth token is correct
   - Ensure you have an active ngrok account
   - Verify your internet connection

2. **"Tunnel already exists"**:

   - The service will automatically handle existing tunnels
   - Use the API to stop and restart if needed

3. **Port conflicts**:
   - Ensure your app port is not already in use
   - Check if another ngrok instance is running

### Security Notes

- Never commit your ngrok auth token to version control
- Use environment variables for sensitive configuration
- Consider using ngrok's domain restrictions for production use
