const cors = require('cors');

function getAllowedOrigins() {
  const origins = [];
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Development origins
  if (!isProduction) {
    origins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    );
  }
  
  // Production origins from environment variables
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  // Additional allowed origins (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...additionalOrigins);
  }
  
  // Auto-detect Vercel preview deployments
  if (process.env.VERCEL && process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  return origins;
}

function configureCORS() {
  return cors({
    origin: function (origin, callback) {
      const allowedOrigins = getAllowedOrigins();
      
      console.log('🔍 CORS Check:');
      console.log('   Origin:', origin);
      console.log('   Allowed Origins:', allowedOrigins);
      console.log('   Environment:', process.env.NODE_ENV === 'production' ? 'production' : 'development');
      
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin) {
        console.log('   ✅ No origin - allowing request');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('   ✅ Origin allowed');
        callback(null, true);
      } else {
        console.log('   ❌ Origin blocked by CORS');
        callback(new Error(`CORS blocked: ${origin} not in allowed origins`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    optionsSuccessStatus: 200
  });
}

module.exports = { configureCORS, getAllowedOrigins };