type Logger = {
  error: (text: string) => void;
  warning: (text: string) => void;
  notice: (text: string) => void;
  info: (text: string) => void;
  debug: (text: string) => void;
  verbose: (text: string) => void;
  success: (text: string) => void;
};

declare module '@serverless/utils/log' {
  // eslint-disable-next-line import/prefer-default-export
  export const log: Logger;
}
