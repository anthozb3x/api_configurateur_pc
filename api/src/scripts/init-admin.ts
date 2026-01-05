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

    // Vérifier que le mot de passe respecte les critères de sécurité
    if (adminPassword.length < 6) {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('ℹ️  Un administrateur existe déjà avec cet email');
      await mongoose.connection.close();
      return;
    }

    // Créer l'administrateur (le hook pre('save') hash automatiquement le mot de passe)
    const admin = new User({
      email: adminEmail,
      password: adminPassword, // Sera hashé automatiquement par le hook pre('save')
      firstName: 'Admin',
      lastName: 'ConfigurateurPC',
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Administrateur créé avec succès');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Mot de passe: ${adminPassword}`);
    console.log('⚠️  N\'oubliez pas de changer le mot de passe après la première connexion');
    console.log('🔒 Le mot de passe a été hashé de manière sécurisée');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

initAdmin();


