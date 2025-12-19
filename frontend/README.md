# Asterix Frontend - NHS Letters Manager

A modern React/Next.js frontend for uploading and managing NHS letters with AI-powered summaries.

## Features

- **Login Page**: Secure authentication with username/password
- **Upload Page**: Drag-and-drop PDF upload with real-time NHS number extraction
- **Processing Alert**: Visual feedback showing the summary is being generated
- **Letters Table**: Search and view all letters by NHS number with status tracking

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API deployed (see `iac/asterix-task`)

### Installation

```bash
npm install
```

### Configuration

Create a `.env.local` file with your API Gateway endpoint:

```bash
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.eu-west-2.amazonaws.com/Prod
```

You can find this URL in the CloudFormation outputs after deploying the backend stack.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Pages

### Login (`/login`)

Secure login page:

- Username and password authentication
- Tokens stored in localStorage
- Auto-redirect when already authenticated

**Demo Credentials** (from backend):

- Username: `admin`, Password: `admin123`
- Username: `user`, Password: `user123`

### Upload (`/`)

Upload NHS letters (PDF only) to the system:

- Drag and drop or click to select a file
- Automatically extracts NHS number from the PDF
- Shows processing status alert after successful upload

### Letters (`/letters`)

View uploaded letters by NHS number:

- Search by NHS number
- View letter details: file name, date, status, pages, size
- See AI-generated summaries once processing is complete

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **TypeScript** - Type safety

## API Endpoints Used

| Endpoint                 | Method | Description                     | Auth Required |
| ------------------------ | ------ | ------------------------------- | ------------- |
| `/login`                 | POST   | Authenticate user               | No            |
| `/upload`                | POST   | Upload a PDF file               | Yes           |
| `/files/nhs/{nhsNumber}` | GET    | Get all files for an NHS number | Yes           |
| `/files/last`            | GET    | Get the last uploaded file      | Yes           |
