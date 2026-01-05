import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.model';

dotenv.config();

const defaultCategories = [
  { name: 'CPU', description: 'Processeurs' },
  { name: 'GPU', description: 'Cartes graphiques' },
  { name: 'RAM', description: 'Mémoire vive' },
  { name: 'Stockage', description: 'Disques durs et SSD' },
  { name: 'Carte mère', description: 'Cartes mères' },
  { name: 'Boîtier', description: 'Boîtiers PC' },
  { name: 'Alimentation', description: 'Blocs d\'alimentation' },
  { name: 'Refroidissement', description: 'Ventilateurs et refroidisseurs' },
  { name: 'Carte réseau', description: 'Cartes réseau et Wi-Fi' },
  { name: 'Autre', description: 'Autres composants' },
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connecté à MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Catégories existantes supprimées');

    // Insert default categories
    const categories = await Category.insertMany(defaultCategories);
    console.log(`✅ ${categories.length} catégories créées avec succès`);

    categories.forEach((cat) => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedCategories();

