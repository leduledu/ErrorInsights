# ErrorInsights Dashboard

A real-time error tracking and insights dashboard built with Angular frontend and Node.js backend, designed for internal development teams to monitor and analyze application errors.

## Quick Start with Docker Compose

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### Start the Application

1. **Clone the repository:**
   git clone <repository-url>
   cd ErrorInsights

2. **Start all services:**
   docker-compose up -d

3. **Access the application:**
   - **Frontend:** http://localhost:4200
   - **Backend API:** http://localhost:3000

### Services Included

| Service | Port | Description |
| **Frontend** | 4200 | Angular dashboard |
| **Backend** | 3000 | Node.js API server |
| **MongoDB** | 27017 | Primary database |
| **Elasticsearch** | 9200 | Search & analytics |
| **Redis** | 6379 | Caching layer |
| **Kafka** | 9092 | Message streaming |
| **Zookeeper** | 2181 | Kafka coordination |

### Useful Commands

```bash
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# View service status
docker-compose ps
```

## Development

### Local Development (without Docker)


1. **Install dependencies:**
   # Backend
   cd backend && npm install
   
   # Frontend  
   cd frontend && npm install

2. **Start infrastructure services:**

   docker-compose up -d mongodb elasticsearch redis kafka zookeeper

3. **Start applications:**
   # Backend (Terminal 1)
   cd backend && npm run dev
   
   # Frontend (Terminal 2)
   cd frontend && npm start

### Environment Variables

The application uses these environment variables (automatically configured in Docker):

| Variable | Default | Description |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://admin:password@mongodb:27017/error-insights | MongoDB connection |
| `ELASTICSEARCH_NODE` | http://elasticsearch:9200 | Elasticsearch URL |
| `REDIS_HOST` | redis | Redis hostname |
| `KAFKA_BROKERS` | kafka:9092 | Kafka broker addresses |

## Features

- **Real-time Error Tracking:** Live error monitoring with WebSocket updates
- **Advanced Filtering:** Filter errors by date, user, browser, URL, and keywords
- **Error Analytics:** Statistics and trends visualization
- **Detailed Error Views:** Full error details with stack traces
- **Mock Data Generation:** Built-in error simulation for testing
- **Multi-Service Architecture:** Scalable microservices design

### Reset Everything
ß
# Stop and remove everything
docker-compose down -v

# Remove all containers and images
docker system prune -a

# Start fresh
docker-compose up -d

## API Endpoints

| Method | Endpoint | Description |
| GET | `/api/v1/events/search` | Search error events |
| GET | `/api/v1/events/stats` | Get error statistics |
| GET | `/api/v1/events/browsers` | List available browsers |
| GET | `/api/v1/events/users` | List users with errors |
| GET | `/api/v1/events/mock/start` | Start mock error generation |
