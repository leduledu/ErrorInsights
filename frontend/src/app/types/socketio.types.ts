import { ErrorEvent } from '../models/error-event.model';

export interface ISocketIOEvents {
  'subscribe:errors': () => void;
  'errors:initial': (errors: ErrorEvent[]) => void;
  'errors:new': (error: ErrorEvent) => void;
}