import { IErrorEvent } from './error-event.types';

export interface ISocketIOEvents {

  'subscribe:errors': () => void;
  
  'errors:initial': (errors: IErrorEvent[]) => void;
  'errors:new': (error: IErrorEvent) => void;
}
