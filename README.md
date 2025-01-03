# Location-Based Drinking Game

A real-time, location-based multiplayer game built with Django (GeoDjango) backend and Ionic/React frontend. The game involves teams of players hunting each other within defined geographical boundaries while completing challenges.

## Project Structure

The project consists of two main components:

### Backend (`geodjango_tutorial`)
- Built with Django and GeoDjango for spatial functionality
- Uses PostgreSQL with PostGIS extension for spatial data
- WebSocket support for real-time communication
- Redis for caching and WebSocket channels
- Nginx as reverse proxy
- Docker containerization

### Frontend (`drinking-game-frontend`)
- Built with Ionic Framework and React
- Real-time location tracking and mapping
- Team-based chat functionality
- Mobile-first responsive design
- Support for both web and native mobile platforms

## Features

- **User Authentication**: Login/Register system with token-based authentication
- **Real-time Location Tracking**: Track players' locations using device GPS
- **Team-based Gameplay**: Players are divided into hunter and hunted teams
- **In-game Chat**: Real-time chat functionality between team members
- **Dynamic Game Areas**: Configurable play areas with automatic boundary reduction
- **Game Hosting**: Users can create and host games
- **Mobile Support**: Native mobile support through Ionic Capacitor

## Technical Stack

### Backend
- Django/GeoDjango
- PostgreSQL/PostGIS
- Redis
- Channels (WebSocket)
- Docker
- Nginx
- Gunicorn/Daphne

### Frontend
- Ionic Framework
- React
- TypeScript
- Leaflet (mapping)
- WebSocket
- Capacitor (mobile native features)

## Setup

### Backend Setup

1. Clone the repository
2. Install Docker and Docker Compose
3. Set up environment variables:

4. Start the development server:

bash
cp .env.dev .env
bash
Windows
start_dev.bat
Linux/Mac
./start_dev.sh

### Frontend Setup

1. Navigate to the frontend directory:

bash
cd drinking-game-frontend

2. Install dependencies:

bash
npm install

3. Set up environment variables:
bash
cp .env.development .env
bash
npm run dev

## Development

### Backend Development
- The backend runs on port 8001 by default
- Uses Django's development server in dev mode
- Automatic code reloading enabled
- PostgreSQL runs on port 5433

### Frontend Development
- Development server runs on port 5173
- Hot module replacement enabled
- Mobile testing through Ionic DevApp
- Native builds available through Capacitor

## Deployment

### Backend Deployment
- Uses Docker Compose for orchestration
- Nginx handles SSL termination
- Automatic SSL certificate renewal through Certbot
- Production settings with debug disabled

### Frontend Deployment
- Build the production bundle:

bash
npm run build

- Deploy static files to web server
- Configure environment variables for production API endpoints

## Environment Variables

### Backend
- `DEBUG`: Enable/disable debug mode
- `SECRET_KEY`: Django secret key
- `DB_NAME`: PostgreSQL database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `REDIS_HOST`: Redis host
- `ALLOWED_HOSTS`: Allowed host names

### Frontend
- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket server URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.