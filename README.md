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

# 🤖 Bot Meeting BE

A powerful backend service that automates joining online meetings, records video and chat content, transcribes multilingual speech to text using Google Cloud Speech-to-Text, and summarizes or answers questions about the meeting using OpenAI GPT.

<p align="center">
  <img src="https://res.cloudinary.com/dkwth9uyw/image/upload/v1749136184/Screenshot_2025-06-05_at_22.07.55_mlvvbh.png" width="100%" alt="swagger docs" /></a>
</p>

---

## 🚀 Tech Stack

- **NestJS** – Scalable Node.js framework
- **MongoDB** – NoSQL database for storing meeting data
- **Puppeteer** – Headless browser automation for joining & recording meetings
- **Google Cloud Speech-to-Text** – Transcribes multilingual audio
- **OpenAI GPT** – Summarizes and answers questions about meeting content
- **BullMQ / Job Queue** – Manages meeting and transcription tasks with queue to prevent overload

---

## 🎯 Main Features

- Auto-join to online meetings via **Google Meet**, **Zoom**, and **Microsoft Teams**
- **Record** video and **capture** chat messages during the meeting
- Convert meeting video to **multilingual text transcripts** via Google Cloud
- Use **OpenAI GPT** to:
  - Summarize key meeting points
  - Act as a virtual assistant for Q&A on the meeting content
- Store all data including video, transcript, summary, Q&A in **MongoDB**
- Use **job queue** to schedule and manage bots efficiently, avoiding overload

---

## 📦 Installation

1. **Clone the repository**

```bash
git clone https://github.com/PhanNhatLoi/meeting-bot-be.git
cd bot-meeting-be
```
Install dependencies
```bash

npm install
# or
yarn install
```
Set up environment variables

Create a .env file in the root directory based on .env.example. Example:

```env
PORT=8911
ENVIRONMENT=develop
JWT_ACCESS_TOKEN_EXPIRATION_TIME= 1d
JWT_REFRESH_TOKEN_EXPIRATION_TIME= 3d
DATABASE_URI=
DATABASE_NAME=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI= <your_api_link>/api/v1/google/register-calendar
USER_NAME="auto bot"
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_SENDER=
SMTP_PASSWORD=
OPENAI_API_KEY=
ALIBABA_DASHSCOPE_API_KEY=

STRIPE_SECRET_KEY=
STRIPE_ENDPOINT_SECRET_KEY=
GEMINI_API_KEY=
DOCKER_PORT=
DOCKER_HOST="localhost"
DISPLAY = ":99"

```
▶️ Running the App
```bash
npm run start:dev
# or
yarn start:dev
```
## Demo link: https://mtgrec.api.int.zebra-ai.net/swagger
Auth swagger docs:
username: admin
password: admin@1230
