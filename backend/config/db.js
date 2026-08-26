// MongoDB connection helper with safe defaults.
const mongoose = require('mongoose');
const dns = require('dns');

// Some networks fail to resolve mongodb+srv:// SRV records against the
// system default DNS resolver; forcing a public resolver avoids that.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = connectDb;
