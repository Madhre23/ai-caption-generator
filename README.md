# AI Caption Generator

## Project Overview

For this project, I created an AI Caption Generator web app. The main idea of the app is simple: a user can create an account, sign in, enter a topic or idea, and use AI to generate a short caption. The user can also save captions, view saved captions, edit them, and delete them.

I wanted to keep the project straightforward while still meeting the full-stack requirements. The app includes a frontend, backend server, database, user authentication, and an external AI API using Google's Gemini API.

## Features Developed

* User signup system
* User signin/login system
* Logout functionality
* Session-based authentication
* AI caption generation using Gemini API
* Saved captions section
* Create, Read, Update, and Delete functionality for saved captions
* SQLite database for user accounts and saved captions
* Password hashing using bcrypt
* Professional frontend design using HTML, CSS, and JavaScript

## Technologies Used

* HTML
* CSS
* JavaScript
* Node.js
* Express.js
* SQLite
* bcrypt
* express-session
* dotenv
* Google Gemini API

## API Used

The API used in this project is the Google Gemini API.

The app sends the user's caption idea to Gemini, and Gemini returns a short social media caption. The API key is stored in a `.env` file locally and as an environment variable during deployment. The API key is not uploaded to GitHub.

## Database Schema

The project uses a SQLite database.

### users table

| Column   | Type    | Description          |
| -------- | ------- | -------------------- |
| id       | INTEGER | Primary key          |
| username | TEXT    | User's username      |
| email    | TEXT    | User's email address |
| password | TEXT    | Hashed user password |

### captions table

| Column         | Type     | Description                           |
| -------------- | -------- | ------------------------------------- |
| id             | INTEGER  | Primary key                           |
| user_id        | INTEGER  | Connects caption to a user            |
| prompt         | TEXT     | The topic or idea entered by the user |
| generated_text | TEXT     | The AI-generated caption              |
| created_at     | DATETIME | Time the caption was saved            |

## How to Run the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Madhre23/ai-caption-generator
cd ai-caption-generator
```

### 2. Install dependencies

```bash
npm install
```

If using PowerShell on Windows and npm gives an execution policy error, use:

```bash
npm.cmd install
```

### 3. Create a `.env` file

Create a `.env` file in the main project folder and add:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SESSION_SECRET=your_session_secret_here
```

### 4. Start the server

```bash
npm start
```

Or on Windows:

```bash
npm.cmd start
```

### 5. Open the app

Go to:

```text
http://localhost:3000
```

## How the App Works

User passwords are hashed using bcrypt before being stored in the SQLite database. The app uses express-session to keep users logged in during their session. Protected routes check whether a user is logged in before allowing access to caption generation and saved caption features. 

After signing in, the user can enter a topic such as "birthday photo" or "vacation post." The backend sends that prompt to the Gemini API, and the generated caption is displayed on the dashboard.

If the user likes the caption, they can save it. Saved captions stay in the database, so when the user logs out and logs back in, the saved captions are still there. The user can also edit or delete saved captions.

## Deployment

The app is deployed online using a free hosting service.

Deployed app URL:

```text
https://ai-caption-generator-wt68.onrender.com
```

## Test Login

A test account is provided so the project can be reviewed.

```text
Email: test@example.com
Password: test123
```
If the test account does not exist because the free Render service restarted, please create a new account using the signup form. 

## Notes

This project was built to practice creating a basic full-stack web app with authentication, database persistence, and AI API integration. I kept the functionality simple and focused on the required features: signup/signin, a main app page, database storage, CRUD operations, API integration, and deployment.

