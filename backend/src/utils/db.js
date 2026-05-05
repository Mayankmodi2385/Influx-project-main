const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ MongoDB Atlas Connected Successfully');
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Host: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB Atlas:');
    console.error(`   ${error.message}`);
    console.error('\nPlease check:');
    console.error('   1. MONGO_URI is set correctly in .env file');
    console.error('   2. MongoDB Atlas network access allows your IP');
    console.error('   3. Database credentials are correct');
    process.exit(1);
  }
};

module.exports = connectDB;











