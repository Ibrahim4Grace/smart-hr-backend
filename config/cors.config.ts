

export default () => {
  const whitelist = (process.env.CORS_WHITELIST || '').split(',');

  return {
    cors: {
      origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 201,
    },
  };
};
