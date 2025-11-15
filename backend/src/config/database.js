const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async (retries = 5) => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdfai';
  
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  let attempt = 0;

  while (attempt < retries) {
    try {
      await mongoose.connect(MONGODB_URI, options);
      
      logger.info('✅ MongoDB connecté avec succès');
      logger.info(`📊 Base de données: ${mongoose.connection.name}`);
      
      mongoose.connection.on('error', (err) => {
        logger.error('❌ Erreur MongoDB:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️  MongoDB déconnecté');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB reconnecté');
      });

      return;
    } catch (error) {
      attempt++;
      logger.error(`❌ Échec de connexion MongoDB (tentative ${attempt}/${retries}):`, error.message);
      
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        logger.info(`⏳ Nouvelle tentative dans ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('❌ Impossible de se connecter à MongoDB');
        process.exit(1);
      }
    }
  }
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('🔌 Connexion MongoDB fermée');
  } catch (error) {
    logger.error('❌ Erreur lors de la fermeture:', error);
  }
};

module.exports = connectDB;
module.exports.closeDB = closeDB;