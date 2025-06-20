import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://Paulis:JPOS2002@cluster0.sau74vj.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'sample_mflix';

let db = null;
let client = null;

async function connectToDB() {
  if (db) return db;
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
    return db;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    throw err;
  }
}

async function closeConnection() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed!!!!');
    client = null;
    db = null;
  }
}

export { connectToDB, closeConnection ,closeConnection};