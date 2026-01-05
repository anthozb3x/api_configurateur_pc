# Guide de démarrage - ConfigurateurPC API

## 🚀 Installation et configuration

### Étape 1 : Démarrer MongoDB avec Docker

```bash
docker-compose up -d
```

Cette commande va :
- Créer un conteneur MongoDB 7.0
- Exposer le port 27017
- Créer un utilisateur admin avec le mot de passe `admin123`
- Créer la base de données `configurateurpc`

Pour vérifier que MongoDB fonctionne :
```bash
docker ps
```

### Étape 2 : Installer les dépendances de l'API

```bash
cd api
npm install
```

### Étape 3 : Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `api/` :

```bash
cp .env.example .env
```

Puis modifiez le fichier `.env` si nécessaire. Les valeurs par défaut sont :
- `PORT=3000`
- `MONGODB_URI=mongodb://admin:admin123@localhost:27017/configurateurpc?authSource=admin`
- `JWT_SECRET=your-super-secret-jwt-key-change-in-production` ⚠️ **Changez cette valeur en production !**
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=http://localhost:3001`

### Étape 4 : Initialiser un utilisateur administrateur

```bash
npm run init:admin
```

Cela créera un utilisateur admin avec :
- Email : `admin@configurateurpc.com`
- Mot de passe : `admin123`

⚠️ **N'oubliez pas de changer le mot de passe après la première connexion !**

Vous pouvez personnaliser ces valeurs en ajoutant dans votre `.env` :
```env
ADMIN_EMAIL=votre-email@example.com
ADMIN_PASSWORD=votre-mot-de-passe-securise
```

### Étape 5 : Démarrer l'API

**Mode développement** (avec hot-reload) :
```bash
npm run dev
```

**Mode production** :
```bash
npm run build
npm start
```

L'API sera accessible sur `http://localhost:3000`

## 📚 Documentation API

Une fois l'API démarrée, accédez à la documentation Swagger :
```
http://localhost:3000/api-docs
```

## 🧪 Tests

Pour lancer les tests :
```bash
npm test
```

Pour lancer les tests en mode watch :
```bash
npm run test:watch
```

Pour générer un rapport de couverture :
```bash
npm run test:coverage
```

## 🔐 Première connexion

1. **Inscription d'un utilisateur** :
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

2. **Connexion** :
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

3. **Utiliser le token JWT** :
Copiez le token retourné et utilisez-le dans les en-têtes pour les routes protégées :
```
Authorization: Bearer <votre-token-jwt>
```

## 📝 Exemples d'utilisation

### Créer une catégorie (Admin)

```bash
POST http://localhost:3000/api/categories
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "name": "CPU",
  "description": "Processeurs"
}
```

### Créer un composant (Admin)

```bash
POST http://localhost:3000/api/components
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "category": "<id-categorie>",
  "title": "Intel Core i9-13900K",
  "brand": "Intel",
  "model": "i9-13900K",
  "description": "Processeur haut de gamme",
  "specifications": {
    "cores": 24,
    "threads": 32,
    "baseFrequency": "3.0 GHz"
  }
}
```

### Créer une configuration

```bash
POST http://localhost:3000/api/configurations
Authorization: Bearer <token-utilisateur>
Content-Type: application/json

{
  "name": "PC Gaming",
  "components": [
    {
      "component": "<id-composant-1>",
      "quantity": 1,
      "selectedMerchant": "<id-partenaire>"
    },
    {
      "component": "<id-composant-2>",
      "quantity": 2
    }
  ]
}
```

## 🛠️ Commandes utiles

- `npm run dev` - Démarre le serveur en mode développement
- `npm run build` - Compile TypeScript
- `npm start` - Démarre le serveur en production
- `npm test` - Lance les tests
- `npm run lint` - Vérifie le code avec ESLint
- `npm run format` - Formate le code avec Prettier
- `npm run init:admin` - Crée un utilisateur admin

## 🐳 Commandes Docker

- `docker-compose up -d` - Démarre MongoDB
- `docker-compose down` - Arrête MongoDB
- `docker-compose logs -f mongodb` - Voir les logs MongoDB
- `docker-compose ps` - Voir l'état des conteneurs

## ⚠️ Dépannage

### MongoDB ne démarre pas
- Vérifiez que Docker est en cours d'exécution
- Vérifiez que le port 27017 n'est pas déjà utilisé
- Consultez les logs : `docker-compose logs mongodb`

### Erreur de connexion à MongoDB
- Vérifiez que le conteneur est démarré : `docker ps`
- Vérifiez l'URI MongoDB dans le fichier `.env`
- Vérifiez les identifiants (admin/admin123 par défaut)

### Erreurs TypeScript
- Assurez-vous d'avoir installé toutes les dépendances : `npm install`
- Vérifiez que TypeScript est installé : `npm list typescript`

## 📦 Prochaines étapes

1. ✅ API RESTful avec authentification JWT
2. ✅ Documentation Swagger/OpenAPI
3. ✅ Tests unitaires
4. ⏳ BackOffice Next.js (à venir)
5. ⏳ Export PDF des configurations
6. ⏳ Vérification de compatibilité des composants

