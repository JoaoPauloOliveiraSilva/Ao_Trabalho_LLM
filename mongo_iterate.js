import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://Paulis:JPOS2002@cluster0.sau74vj.mongodb.net/?retryWrites=true&w=majority';
const dbName = process.env.MONGODB_DB_NAME || 'sample_mflix';

let db = null;
let client = null;

async function connectToDB() {
  if (db) return db;

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000
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
