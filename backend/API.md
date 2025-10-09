# Error Insights Dashboard API

## Overview

The Error Insights Dashboard API provides endpoints for searching, filtering, and analyzing error events from frontend applications.

## Base URL

http://localhost:3000/api/v1

## Authentication

Currently, no authentication is required for development. In production, implement proper authentication middleware.

## Endpoints

### Error Events

#### GET /events/search
Search error events with filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)
- `sortBy` (string, optional): Sort field (default: 'timestamp')
- `sortOrder` (string, optional): Sort order 'asc' or 'desc' (default: 'desc')
- `startDate` (string, optional): Start date filter (ISO string)
- `endDate` (string, optional): End date filter (ISO string)
- `userId` (string, optional): Filter by user ID
- `browser` (string, optional): Filter by browser
- `url` (string, optional): Filter by URL
- `keyword` (string, optional): Search keyword in error message or stack trace

**Example Request:**
```
GET /events/search?page=1&pageSize=20&userId=user-123&browser=Chrome&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z
```

#### GET /events/stats
Get error event statistics and aggregations.

**Query Parameters:**
- `startDate` (string, optional): Start date filter (ISO string)
- `endDate` (string, optional): End date filter (ISO string)
- `userId` (string, optional): Filter by user ID
- `browser` (string, optional): Filter by browser
- `url` (string, optional): Filter by URL


#### GET /events/browsers
Get list of unique browsers.

#### GET /events/urls
Get list of unique URLs.

#### GET /events/users
Get list of unique users.


#### GET /events/mock/start
Start generating mock error events for testing purposes. This will start sending new errors over the producer (Kafka)

**Query Parameters:**
- `intervalMs` (number, optional): Interval between errors in milliseconds (default: 5000, min: 1000)
- `errorCount` (number, optional): Number of errors to generate (default: 10, min: 1)

## Rate Limiting

API requests are rate limited to 100 requests per 15-minute window per IP address.

## Caching

Search results and statistics are cached in Redis with appropriate TTL:
- Search results: 5-10 minutes (depending on specificity)
- Statistics: 30-60 minutes
- Metadata (browsers, URLs, users): 30 minutes

## Development

### Starting the Server

npm install

npm start

### Test the server

npm test

Required services:
- MongoDB (port 27017)
- Elasticsearch (port 9200)
- Redis (port 6379)
- Kafka (port 9092)

### Docker

Use the provided `docker-compose.yml` to start all services:

docker-compose up -d
