# Telemedicine Video Consultation Platform

A secure, real-time video consultation platform built with Next.js, Express, Socket.IO, and WebRTC. This application enables doctors to create consultation rooms and patients to join using a shared room ID.

## Features

- **Doctor Interface**: Create a consultation room and share the room ID with patients
- **Patient Interface**: Join a consultation using a room ID
- **Real-time Video/Audio**: High-quality peer-to-peer video and audio streaming
- **Responsive Design**: Works on desktop and mobile devices
- **Secure**: End-to-end encrypted communication

## Prerequisites

- Node.js 16.8 or later
- npm or yarn
- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telemedicine-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Install development dependencies**
   ```bash
   npm install -g ts-node typescript
   npm install --save-dev concurrently @types/node
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:all
   ```
   This will start:
   - Next.js frontend on http://localhost:3000
   - Express backend on http://localhost:5000

## Usage

1. **For Doctors**
   - Visit http://localhost:3000/doctor
   - Click "Start Consultation"
   - Share the room link with your patient

2. **For Patients**
   - Click the shared room link or visit http://localhost:3000/patient
   - Enter the room ID provided by the doctor
   - Click "Join Consultation"

## Project Structure

- `/src/app` - Next.js application pages
  - `/doctor` - Doctor interface
  - `/patient` - Patient interface
- `/server` - Express server with Socket.IO
- `/src/utils` - Shared utilities and WebRTC logic

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Express](https://expressjs.com/) - Backend server
- [Socket.IO](https://socket.io/) - Real-time communication
- [WebRTC](https://webrtc.org/) - Peer-to-peer video/audio
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## License

This project is licensed under the MIT License.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# SIH2025_backend
