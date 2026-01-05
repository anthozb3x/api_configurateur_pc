import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.model';
import Component from '../models/Component.model';
import User from '../models/User.model';
import Merchant from '../models/Merchant.model';
import Configuration from '../models/Configuration.model';

dotenv.config();

// Données mock pour les catégories
const mockCategories = [
  { name: 'CPU', description: 'Processeurs' },
  { name: 'GPU', description: 'Cartes graphiques' },
  { name: 'RAM', description: 'Mémoire vive' },
  { name: 'Stockage', description: 'Disques durs et SSD' },
  { name: 'Carte mère', description: 'Cartes mères' },
  { name: 'Boîtier', description: 'Boîtiers PC' },
  { name: 'Alimentation', description: 'Blocs d\'alimentation' },
  { name: 'Refroidissement', description: 'Ventilateurs et refroidisseurs' },
];

// Données mock pour les composants
const getMockComponents = (categoryIds: Record<string, mongoose.Types.ObjectId>) => [
  // CPUs
  {
    category: categoryIds['CPU'],
    title: 'AMD Ryzen 9 7950X',
    brand: 'AMD',
    model: 'Ryzen 9 7950X',
    description: 'Processeur 16 cœurs 32 threads, 4.5 GHz base, 5.7 GHz boost',
    specifications: {
      cores: 16,
      threads: 32,
      baseFrequency: '4.5 GHz',
      boostFrequency: '5.7 GHz',
      tdp: 170,
      socket: 'AM5',
    },
    price: 699.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['CPU'],
    title: 'Intel Core i9-13900K',
    brand: 'Intel',
    model: 'Core i9-13900K',
    description: 'Processeur 24 cœurs 32 threads, 3.0 GHz base, 5.8 GHz boost',
    specifications: {
      cores: 24,
      threads: 32,
      baseFrequency: '3.0 GHz',
      boostFrequency: '5.8 GHz',
      tdp: 125,
      socket: 'LGA1700',
    },
    price: 649.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['CPU'],
    title: 'AMD Ryzen 7 7800X3D',
    brand: 'AMD',
    model: 'Ryzen 7 7800X3D',
    description: 'Processeur 8 cœurs 16 threads avec cache 3D V-Cache',
    specifications: {
      cores: 8,
      threads: 16,
      baseFrequency: '4.2 GHz',
      boostFrequency: '5.0 GHz',
      tdp: 120,
      socket: 'AM5',
    },
    price: 449.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['CPU'],
    title: 'Intel Core i5-13600K',
    brand: 'Intel',
    model: 'Core i5-13600K',
    description: 'Processeur 14 cœurs 20 threads, excellent rapport qualité/prix',
    specifications: {
      cores: 14,
      threads: 20,
      baseFrequency: '3.5 GHz',
      boostFrequency: '5.1 GHz',
      tdp: 125,
      socket: 'LGA1700',
    },
    price: 329.99,
    currency: 'EUR',
  },
  // GPUs
  {
    category: categoryIds['GPU'],
    title: 'NVIDIA GeForce RTX 4090',
    brand: 'NVIDIA',
    model: 'RTX 4090',
    description: 'Carte graphique haut de gamme avec 24 Go de VRAM',
    specifications: {
      vram: '24 GB',
      memoryType: 'GDDR6X',
      memoryBus: '384-bit',
      cudaCores: 16384,
      boostClock: '2520 MHz',
    },
    price: 1899.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['GPU'],
    title: 'AMD Radeon RX 7900 XTX',
    brand: 'AMD',
    model: 'RX 7900 XTX',
    description: 'Carte graphique AMD avec 24 Go de VRAM',
    specifications: {
      vram: '24 GB',
      memoryType: 'GDDR6',
      memoryBus: '384-bit',
      computeUnits: 96,
      boostClock: '2500 MHz',
    },
    price: 1099.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['GPU'],
    title: 'NVIDIA GeForce RTX 4070',
    brand: 'NVIDIA',
    model: 'RTX 4070',
    description: 'Carte graphique milieu de gamme avec 12 Go de VRAM',
    specifications: {
      vram: '12 GB',
      memoryType: 'GDDR6X',
      memoryBus: '192-bit',
      cudaCores: 5888,
      boostClock: '2475 MHz',
    },
    price: 649.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['GPU'],
    title: 'AMD Radeon RX 7800 XT',
    brand: 'AMD',
    model: 'RX 7800 XT',
    description: 'Carte graphique AMD avec 16 Go de VRAM',
    specifications: {
      vram: '16 GB',
      memoryType: 'GDDR6',
      memoryBus: '256-bit',
      computeUnits: 60,
      boostClock: '2430 MHz',
    },
    price: 549.99,
    currency: 'EUR',
  },
  // RAM
  {
    category: categoryIds['RAM'],
    title: 'Corsair Vengeance DDR5 32GB',
    brand: 'Corsair',
    model: 'CMK32GX5M2B6000C36',
    description: 'Kit mémoire DDR5 32 Go (2x16 Go) 6000 MHz',
    specifications: {
      capacity: '32 GB',
      modules: 2,
      speed: '6000 MHz',
      latency: 'CL36',
      voltage: '1.35V',
    },
    price: 149.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['RAM'],
    title: 'G.Skill Trident Z5 DDR5 64GB',
    brand: 'G.Skill',
    model: 'F5-6000J3636F16GX2-TZ5RK',
    description: 'Kit mémoire DDR5 64 Go (2x32 Go) 6000 MHz',
    specifications: {
      capacity: '64 GB',
      modules: 2,
      speed: '6000 MHz',
      latency: 'CL36',
      voltage: '1.35V',
    },
    price: 279.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['RAM'],
    title: 'Kingston Fury Beast DDR4 32GB',
    brand: 'Kingston',
    model: 'KF432C16BB1K2/32',
    description: 'Kit mémoire DDR4 32 Go (2x16 Go) 3200 MHz',
    specifications: {
      capacity: '32 GB',
      modules: 2,
      speed: '3200 MHz',
      latency: 'CL16',
      voltage: '1.35V',
    },
    price: 99.99,
    currency: 'EUR',
  },
  // Stockage
  {
    category: categoryIds['Stockage'],
    title: 'Samsung 990 PRO 2TB',
    brand: 'Samsung',
    model: 'MZ-V9P2T0BW',
    description: 'SSD NVMe M.2 2 To PCIe 4.0',
    specifications: {
      capacity: '2 TB',
      interface: 'PCIe 4.0 x4',
      formFactor: 'M.2 2280',
      readSpeed: '7450 MB/s',
      writeSpeed: '6900 MB/s',
    },
    price: 199.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['Stockage'],
    title: 'WD Black SN850X 1TB',
    brand: 'Western Digital',
    model: 'WDS100T2X0E',
    description: 'SSD NVMe M.2 1 To PCIe 4.0',
    specifications: {
      capacity: '1 TB',
      interface: 'PCIe 4.0 x4',
      formFactor: 'M.2 2280',
      readSpeed: '7300 MB/s',
      writeSpeed: '6300 MB/s',
    },
    price: 119.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['Stockage'],
    title: 'Seagate BarraCuda 4TB',
    brand: 'Seagate',
    model: 'ST4000DM004',
    description: 'Disque dur 4 To 5400 RPM',
    specifications: {
      capacity: '4 TB',
      interface: 'SATA 6Gb/s',
      formFactor: '3.5"',
      rpm: 5400,
      cache: '256 MB',
    },
    price: 89.99,
    currency: 'EUR',
  },
  // Cartes mères
  {
    category: categoryIds['Carte mère'],
    title: 'ASUS ROG Strix X670E-E',
    brand: 'ASUS',
    model: 'ROG Strix X670E-E Gaming WiFi',
    description: 'Carte mère AMD AM5 ATX',
    specifications: {
      socket: 'AM5',
      chipset: 'X670E',
      formFactor: 'ATX',
      memorySlots: 4,
      maxMemory: '128 GB',
      pcieSlots: 'PCIe 5.0 x16, PCIe 4.0 x16',
    },
    price: 449.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['Carte mère'],
    title: 'MSI MPG Z790 Carbon WiFi',
    brand: 'MSI',
    model: 'MPG Z790 Carbon WiFi',
    description: 'Carte mère Intel LGA1700 ATX',
    specifications: {
      socket: 'LGA1700',
      chipset: 'Z790',
      formFactor: 'ATX',
      memorySlots: 4,
      maxMemory: '128 GB',
      pcieSlots: 'PCIe 5.0 x16, PCIe 4.0 x16',
    },
    price: 399.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['Carte mère'],
    title: 'Gigabyte B650 Aorus Elite AX',
    brand: 'Gigabyte',
    model: 'B650 Aorus Elite AX',
    description: 'Carte mère AMD AM5 ATX',
    specifications: {
      socket: 'AM5',
      chipset: 'B650',
      formFactor: 'ATX',
      memorySlots: 4,
      maxMemory: '128 GB',
      pcieSlots: 'PCIe 4.0 x16',
    },
    price: 229.99,
    currency: 'EUR',
  },
  // Boîtiers
  {
    category: categoryIds['Boîtier'],
    title: 'Fractal Design Define 7',
    brand: 'Fractal Design',
    model: 'FD-C-DEF7-01',
    description: 'Boîtier ATX silencieux avec fenêtre latérale',
    specifications: {
      formFactor: 'ATX',
      sidePanel: 'Tempered Glass',
      maxGpuLength: '467 mm',
      maxCpuCoolerHeight: '185 mm',
      fanSupport: '7x 120mm / 4x 140mm',
    },
    price: 179.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['Boîtier'],
    title: 'Corsair 4000D Airflow',
    brand: 'Corsair',
    model: 'CC-9011200-WW',
    description: 'Boîtier ATX avec excellent airflow',
    specifications: {
      formFactor: 'ATX',
      sidePanel: 'Tempered Glass',
      maxGpuLength: '360 mm',
      maxCpuCoolerHeight: '170 mm',
      fanSupport: '6x 120mm / 4x 140mm',
    },
    price: 109.99,
    currency: 'EUR',
  },
  // Alimentations
  {
    category: categoryIds['Alimentation'],
    title: 'Corsair RM1000x 1000W',
    brand: 'Corsair',
    model: 'CP-9020239-EU',
    description: 'Alimentation modulaire 1000W 80+ Gold',
    specifications: {
      wattage: '1000 W',
      efficiency: '80+ Gold',
      modular: 'Full Modular',
      connectors: 'ATX 24-pin, EPS 8-pin, PCIe 8-pin',
    },
    price: 189.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['Alimentation'],
    title: 'Seasonic Focus GX-850',
    brand: 'Seasonic',
    model: 'FOCUS-GX-850',
    description: 'Alimentation modulaire 850W 80+ Gold',
    specifications: {
      wattage: '850 W',
      efficiency: '80+ Gold',
      modular: 'Full Modular',
      connectors: 'ATX 24-pin, EPS 8-pin, PCIe 8-pin',
    },
    price: 149.99,
    currency: 'EUR',
  },
  // Refroidissement
  {
    category: categoryIds['Refroidissement'],
    title: 'Noctua NH-D15',
    brand: 'Noctua',
    model: 'NH-D15',
    description: 'Refroidisseur CPU à air double ventilateur',
    specifications: {
      type: 'Air Cooler',
      socket: 'AM5, LGA1700, AM4, LGA1200',
      height: '165 mm',
      fans: 2,
      fanSize: '140 mm',
    },
    price: 99.99,
    currency: 'EUR',
  },
  {
    category: categoryIds['Refroidissement'],
    title: 'Corsair iCUE H150i Elite',
    brand: 'Corsair',
    model: 'CW-9060071-WW',
    description: 'Refroidisseur CPU AIO 360mm',
    specifications: {
      type: 'AIO Liquid Cooler',
      socket: 'AM5, LGA1700, AM4, LGA1200',
      radiatorSize: '360 mm',
      fans: 3,
      fanSize: '120 mm',
    },
    price: 199.99,
    currency: 'EUR',
  },
];

// Données mock pour les utilisateurs
const mockUsers = [
  {
    email: 'admin@configurateurpc.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'ConfigurateurPC',
    role: 'admin' as const,
  },
  {
    email: 'jean.dupont@example.com',
    password: 'password123',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'user' as const,
  },
  {
    email: 'marie.martin@example.com',
    password: 'password123',
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'user' as const,
  },
  {
    email: 'pierre.bernard@example.com',
    password: 'password123',
    firstName: 'Pierre',
    lastName: 'Bernard',
    role: 'user' as const,
  },
];

// Données mock pour les partenaires marchands
const mockMerchants = [
  {
    name: 'Amazon',
    websiteUrl: 'https://www.amazon.fr',
    logoUrl: 'https://logo.clearbit.com/amazon.fr',
    commissionRate: 5.5,
    affiliationConditions: 'Programme d\'affiliation Amazon avec commission de 5.5%',
    isActive: true,
  },
  {
    name: 'LDLC',
    websiteUrl: 'https://www.ldlc.com',
    logoUrl: 'https://logo.clearbit.com/ldlc.com',
    commissionRate: 4.0,
    affiliationConditions: 'Partenariat LDLC avec commission de 4%',
    isActive: true,
  },
  {
    name: 'Materiel.net',
    websiteUrl: 'https://www.materiel.net',
    logoUrl: 'https://logo.clearbit.com/materiel.net',
    commissionRate: 3.5,
    affiliationConditions: 'Partenariat Materiel.net avec commission de 3.5%',
    isActive: true,
  },
  {
    name: 'Rue du Commerce',
    websiteUrl: 'https://www.rueducommerce.fr',
    logoUrl: 'https://logo.clearbit.com/rueducommerce.fr',
    commissionRate: 4.5,
    affiliationConditions: 'Partenariat Rue du Commerce avec commission de 4.5%',
    isActive: true,
  },
];

async function createMocks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connecté à MongoDB\n');

    // 1. Créer les catégories
    console.log('📦 Création des catégories...');
    await Category.deleteMany({});
    const categories = await Category.insertMany(mockCategories);
    const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
    categories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });
    console.log(`✅ ${categories.length} catégories créées\n`);

    // 2. Créer les composants
    console.log('🔧 Création des composants...');
    await Component.deleteMany({});
    const components = await Component.insertMany(
      getMockComponents(categoryMap)
    );
    console.log(`✅ ${components.length} composants créés\n`);

    // 3. Créer les utilisateurs
    // IMPORTANT: Utiliser save() au lieu de insertMany() pour déclencher le hook pre('save')
    // qui hash automatiquement les mots de passe
    console.log('👥 Création des utilisateurs...');
    await User.deleteMany({});
    const users = [];
    for (const userData of mockUsers) {
      // Vérifier que le mot de passe respecte les critères de sécurité
      if (userData.password.length < 6) {
        console.warn(`⚠️  Mot de passe trop court pour ${userData.email}, ignoré`);
        continue;
      }
      
      const user = new User(userData);
      await user.save(); // Le hook pre('save') hash automatiquement le mot de passe
      users.push(user);
    }
    console.log(`✅ ${users.length} utilisateurs créés`);
    users.forEach((user) => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });
    console.log('🔒 Tous les mots de passe ont été hashés de manière sécurisée');
    console.log('');

    // 4. Créer les partenaires marchands
    console.log('🏪 Création des partenaires marchands...');
    await Merchant.deleteMany({});
    const merchants = await Merchant.insertMany(mockMerchants);
    console.log(`✅ ${merchants.length} partenaires créés\n`);

    // 5. Ajouter des prix aux partenaires pour certains composants
    console.log('💰 Ajout de prix aux partenaires...');
    let priceCount = 0;
    for (const merchant of merchants) {
      // Ajouter des prix pour environ 60% des composants
      const componentsToPrice = components.slice(
        0,
        Math.floor(components.length * 0.6)
      );
      
      for (const component of componentsToPrice) {
        // Prix avec variation de ±5% par rapport au prix de base
        const variation = (Math.random() - 0.5) * 0.1; // -5% à +5%
        const merchantPrice = Math.round(
          (component.price || 0) * (1 + variation) * 100
        ) / 100;

        merchant.prices.push({
          component: component._id,
          price: merchantPrice,
          currency: component.currency || 'EUR',
          url: `${merchant.websiteUrl}/product/${component._id}`,
          lastUpdated: new Date(),
        } as any);
        priceCount++;
      }
      await merchant.save();
    }
    console.log(`✅ ${priceCount} prix ajoutés aux partenaires\n`);

    // 6. Créer des configurations pour les utilisateurs
    console.log('💾 Création des configurations...');
    await Configuration.deleteMany({});
    const regularUsers = users.filter((u) => u.role === 'user');
    const configNames = [
      'PC Gaming Performance',
      'Workstation Pro',
      'PC Économique',
      'Setup Streaming',
      'PC Montage Vidéo',
    ];

    let configCount = 0;
    for (const user of regularUsers) {
      // Chaque utilisateur a 1-3 configurations
      const numConfigs = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numConfigs; i++) {
        // Sélectionner 3-7 composants aléatoires
        const numComponents = Math.floor(Math.random() * 5) + 3;
        const selectedComponents = components
          .sort(() => Math.random() - 0.5)
          .slice(0, numComponents);

        const configComponents = selectedComponents.map((comp) => {
          // Trouver un partenaire qui a un prix pour ce composant (optionnel)
          const merchantWithPrice = merchants.find((m) =>
            m.prices.some(
              (p) => p.component.toString() === comp._id.toString()
            )
          );

          const quantity = Math.floor(Math.random() * 2) + 1; // 1 ou 2
          let price = comp.price || 0;
          let selectedMerchant: mongoose.Types.ObjectId | undefined;

          if (merchantWithPrice) {
            const priceObj = merchantWithPrice.prices.find(
              (p) => p.component.toString() === comp._id.toString()
            );
            if (priceObj && Math.random() > 0.3) {
              // 70% de chance d'utiliser le prix du partenaire
              price = priceObj.price;
              selectedMerchant = merchantWithPrice._id;
            }
          }

          return {
            component: comp._id,
            quantity,
            selectedMerchant,
            price: price * quantity,
          };
        });

        const totalCost = configComponents.reduce(
          (sum, comp) => sum + (comp.price || 0),
          0
        );

        const config = new Configuration({
          user: user._id,
          name: `${configNames[configCount % configNames.length]} - ${user.firstName}`,
          components: configComponents,
          totalCost: Math.round(totalCost * 100) / 100,
          currency: 'EUR',
        });

        await config.save();
        configCount++;
      }
    }
    console.log(`✅ ${configCount} configurations créées\n`);

    // Résumé
    console.log('📊 Résumé des données créées:');
    console.log(`   - ${categories.length} catégories`);
    console.log(`   - ${components.length} composants`);
    console.log(`   - ${users.length} utilisateurs`);
    console.log(`   - ${merchants.length} partenaires marchands`);
    console.log(`   - ${priceCount} prix associés aux partenaires`);
    console.log(`   - ${configCount} configurations`);
    console.log('\n✅ Toutes les données mock ont été créées avec succès!');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur lors de la création des données mock:', error);
    process.exit(1);
  }
}

createMocks();

