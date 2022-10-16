class Log {
  public fields: { [key: string]: any } = {};

  public info = (message: string, data?: any) => {
    console.info(message, data);
  };

  public error = (message: string, data?: any) => {
    console.error(message, data);
  };
}

const log = new Log();

export { log };
