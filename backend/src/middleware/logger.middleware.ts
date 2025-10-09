import morgan from 'morgan';

export const requestLogger = morgan('combined', {
  stream: {
    write: (message: string) => {
      console.log(message.trim());
    }
  }
});
