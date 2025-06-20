import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use environment variable or fallback to hardcoded URI
const uri = process.env.MONGODB_URI || 'mongodb+srv://Paulis:JPOS2002@cluster0.sau74vj.mongodb.net/?retryWrites=true&w=majority';
const dbName = process.env.MONGODB_DB_NAME || 'sample_mflix';

let db = null;
let client = null;

async function connectToDB() {
  if (db) return db;

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await client.connect();
    db = client.db(dbName);

    console.log('Connected to MongoDB');
    console.log(`Database: ${dbName}`);

    return db;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    throw err;
  }
}

async function closeConnection() {
  if (client) {
    try {
      await client.close();
      console.log('MongoDB connection closed');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    } finally {
      client = null;
      db = null;
    }
  }
}

export { connectToDB, closeConnection };