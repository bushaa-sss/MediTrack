// Centralized CORS config with allowlist support.
const buildCorsOptions = () => {
  const raw = process.env.CORS_ORIGINS || '';
  const allowlist = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: (origin, callback) => {
      // Allow non-browser requests or same-origin calls (no Origin header).
      if (!origin) return callback(null, true);

      if (allowlist.length === 0 || allowlist.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
};

module.exports = buildCorsOptions;