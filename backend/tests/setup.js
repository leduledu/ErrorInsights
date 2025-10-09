"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
process.env['NODE_ENV'] = 'test';
process.env['MONGODB_URI'] = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/error-insights-test';
process.env['ELASTICSEARCH_NODE'] = process.env['ELASTICSEARCH_NODE'] || 'http://localhost:9200';
process.env['REDIS_HOST'] = process.env['REDIS_HOST'] || 'localhost';
process.env['REDIS_PORT'] = process.env['REDIS_PORT'] || '6379';
process.env['KAFKA_BROKERS'] = process.env['KAFKA_BROKERS'] || 'localhost:9092';
process.env['KAFKA_TOPIC'] = process.env['KAFKA_TOPIC'] || 'error-events-test';
process.env['FRONTEND_URL'] = process.env['FRONTEND_URL'] || 'http://localhost:4200';
jest.setTimeout(30000);