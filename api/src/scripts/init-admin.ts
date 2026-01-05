import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';

dotenv.config();

async function initAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connecté à MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@configurateurpc.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('ℹ️  Un administrateur existe déjà avec cet email');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'ConfigurateurPC',
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Administrateur créé avec succès');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Mot de passe: ${adminPassword}`);
    console.log('⚠️  N\'oubliez pas de changer le mot de passe après la première connexion');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

initAdmin();


