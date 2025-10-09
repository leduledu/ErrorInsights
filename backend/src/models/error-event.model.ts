import { Schema, model, Document } from 'mongoose';
import { IErrorEvent } from '../types/error-event.types';

export interface IErrorEventDocument extends IErrorEvent, Document {
  _id: string;
}

const ErrorEventSchema = new Schema<IErrorEventDocument>(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    browser: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    errorMessage: {
      type: String,
      required: true,
      index: 'text',
      trim: true,
    },
    stackTrace: {
      type: String,
      required: true,
      index: 'text',
    },
  },
  {
    timestamps: true,
    collection: 'error_events',
    toJSON: {
      transform: function (_, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      transform: function (_, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

ErrorEventSchema.index({ timestamp: 1, userId: 1 });
ErrorEventSchema.index({ timestamp: 1, browser: 1 });
ErrorEventSchema.index({ timestamp: 1, url: 1 });
ErrorEventSchema.index({ userId: 1, browser: 1 });
ErrorEventSchema.index({ browser: 1, url: 1 });

ErrorEventSchema.index({
  errorMessage: 'text',
  stackTrace: 'text',
});


ErrorEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

ErrorEventSchema.pre('save', function (next) {

  if (this.timestamp > new Date()) {
    return next(new Error('Timestamp cannot be in the future'));
  }

  try {
    new URL(this.url);
  } catch {
    return next(new Error('Invalid URL format'));
  }

  if (!this.browser || this.browser.trim().length === 0) {
    return next(new Error('Browser cannot be empty'));
  }

  if (!this.userId || this.userId.trim().length === 0) {
    return next(new Error('User ID cannot be empty'));
  }
  next();
});

ErrorEventSchema.methods['toSafeObject'] = function () {
  const obj = this['toObject']();
  return {
    id: obj._id,
    timestamp: obj.timestamp,
    userId: obj.userId,
    browser: obj.browser,
    url: obj.url,
    errorMessage: obj.errorMessage,
    stackTrace: obj.stackTrace,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

export const ErrorEvent = model<IErrorEventDocument>('ErrorEvent', ErrorEventSchema);
