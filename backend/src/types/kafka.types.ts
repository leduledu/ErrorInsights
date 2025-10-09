import { KafkaConfig, Message, ConsumerConfig, ITopicConfig, RecordMetadata } from 'kafkajs';

export type IKafkaConfig = KafkaConfig;
export type IKafkaMessage = Message;
export type IKafkaConsumerConfig = ConsumerConfig;
export type IKafkaTopicConfig = ITopicConfig;

export interface IKafkaProducerResult extends RecordMetadata {
  success: boolean;
  message?: string;
}

export interface IKafkaErrorEvent {
  id: string;
  timestamp: string;
  userId: string;
  browser: string;
  url: string;
  errorMessage: string;
  stackTrace: string;
}

export interface IKafkaServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    topic?: string;
    partition?: number;
    offset?: string | undefined;
    timestamp?: string;
  };
}

export interface IKafkaErrorEventMessage {
  eventType: 'error_event';
  data: IKafkaErrorEvent;
  timestamp: string;
  source: string;
  version: string;
}