// MongoDB initialization script
db = db.getSiblingDB('error-insights');

// Create collections
db.createCollection('error_events');

// Create indexes for better performance
db.error_events.createIndex({ "timestamp": 1 });
db.error_events.createIndex({ "userId": 1 });
db.error_events.createIndex({ "browser": 1 });
db.error_events.createIndex({ "url": 1 });
db.error_events.createIndex({ "errorMessage": "text", "stackTrace": "text" });
db.error_events.createIndex({ "timestamp": 1, "userId": 1 });

// Create a compound index for common queries
db.error_events.createIndex({ 
  "timestamp": 1, 
  "browser": 1, 
  "userId": 1 
});

print('MongoDB initialization completed successfully');
