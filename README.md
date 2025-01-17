# Event Wishes Admin Panel

A modern, streamlined admin panel for managing Event Wishes content, templates, and AdMob integrations.

## Features

- **Dashboard**: View key metrics and insights
- **Template Management**: Create, edit, and manage event templates
- **File Management**: Upload and manage shared files
- **AdMob Integration**: Configure and manage AdMob units
- **Settings**: Customize application behavior and appearance

## Tech Stack

- **Frontend**:
  - React.js
  - Material-UI (MUI)
  - React Router
  - Axios
  - React-Toastify

- **Backend**:
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose
  - Multer (file uploads)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd EventWishes-Admin-Panel
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
```

4. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_uri
PORT=5000
```

5. Start the development server:
```bash
# In the root directory
npm run dev

# In another terminal, start the client
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
EventWishes-Admin-Panel/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.js         # Main app component
│   └── package.json
├── models/                # Mongoose models
├── routes/               # Express routes
├── uploads/             # File uploads directory
├── server.js            # Express server
└── package.json
```

## API Endpoints

### Templates
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create a template
- `PUT /api/templates/:id` - Update a template
- `DELETE /api/templates/:id` - Delete a template

### Files
- `GET /api/files` - Get all files
- `POST /api/files` - Upload a file
- `PUT /api/files/:id` - Update file details
- `DELETE /api/files/:id` - Delete a file

### AdMob
- `GET /api/admob` - Get all AdMob units
- `POST /api/admob` - Create an AdMob unit
- `PUT /api/admob/:id` - Update an AdMob unit
- `DELETE /api/admob/:id` - Delete an AdMob unit

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
