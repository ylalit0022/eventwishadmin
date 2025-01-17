# EventWishes Admin Panel

An admin panel for managing EventWishes templates, users, and insights.

## Project Structure
```
admin/
├── models/
│   ├── Template.js
│   ├── User.js
│   ├── SharedFile.js
│   └── Insight.js
├── routes/
│   ├── templateRoutes.js
│   ├── authRoutes.js
│   └── testRoutes.js
├── middleware/
│   └── auth.js
├── client/
│   └── src/
├── server.js
├── package.json
└── .env
```

## Features
- User Authentication (Login/Register)
- Template Management
- File Sharing
- Analytics & Insights
- User Management
- Settings & Preferences

## Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a .env file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user
- PUT /api/auth/profile - Update user profile
- PUT /api/auth/settings - Update user settings

### Templates
- GET /api/templates - Get all templates
- POST /api/templates - Create new template
- GET /api/templates/:id - Get template by ID
- PUT /api/templates/:id - Update template
- DELETE /api/templates/:id - Delete template
- PATCH /api/templates/:id/toggle-status - Toggle template status

## Security
- JWT based authentication
- Password hashing using bcrypt
- Protected routes using middleware
- Role-based access control
