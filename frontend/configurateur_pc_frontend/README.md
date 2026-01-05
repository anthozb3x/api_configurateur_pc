# ConfigurateurPC - Frontend BackOffice

Interface d'administration pour ConfigurateurPC, développée avec Next.js et shadcn/ui.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- L'API backend doit être en cours d'exécution sur `http://localhost:3000`

### Installation

```bash
# Installer les dépendances
npm install
```

### Configuration

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Démarrage

```bash
# Mode développement
npm run dev
```

L'application sera accessible sur `http://localhost:3001` (port par défaut de Next.js).

## 📋 Fonctionnalités

### Authentification
- Connexion sécurisée pour les administrateurs
- Gestion des sessions avec JWT
- Protection des routes

### Gestion des Composants
- Liste des composants avec filtres (catégorie, marque, recherche)
- Ajout de nouveaux composants
- Modification des composants existants
- Suppression de composants
- Gestion des spécifications techniques (JSON)

### Gestion des Utilisateurs
- Liste de tous les utilisateurs
- Recherche par nom ou email
- Détails d'un utilisateur avec ses configurations sauvegardées

### Gestion des Configurations
- Liste de toutes les configurations
- Recherche par nom ou utilisateur
- Détails d'une configuration (composants, coût total)
- Suppression de configurations

### Gestion des Partenaires Marchands
- Liste des partenaires
- Ajout de nouveaux partenaires
- Modification des informations (nom, URL, commission, etc.)
- Suppression de partenaires
- Gestion du statut actif/inactif

## 🛠️ Technologies

- **Next.js 16** - Framework React
- **TypeScript** - Typage statique
- **shadcn/ui** - Composants UI
- **Tailwind CSS** - Styles
- **Lucide React** - Icônes
- **Sonner** - Notifications toast

## 📁 Structure du projet

```
frontend/configurateur_pc_frontend/
├── app/                    # Pages Next.js (App Router)
│   ├── login/              # Page de connexion
│   ├── dashboard/          # Tableau de bord
│   ├── components/         # Gestion des composants
│   ├── users/              # Gestion des utilisateurs
│   ├── configurations/     # Gestion des configurations
│   └── merchants/          # Gestion des partenaires
├── components/             # Composants React
│   ├── layout/            # Layout et sidebar
│   └── ui/                # Composants UI shadcn
├── lib/                    # Utilitaires
│   ├── api.ts             # Service API
│   ├── types.ts           # Types TypeScript
│   ├── auth-context.tsx   # Contexte d'authentification
│   └── utils.ts           # Fonctions utilitaires
└── public/                 # Fichiers statiques
```

## 🔐 Authentification

Pour vous connecter, utilisez les identifiants administrateur créés via le script `init-admin.ts` de l'API :

- Email : `admin@configurateurpc.com` (par défaut)
- Mot de passe : `admin123` (par défaut)

⚠️ **Changez le mot de passe après la première connexion !**

## 📝 Notes

- Le frontend communique avec l'API via des requêtes HTTP
- Les tokens JWT sont stockés dans le localStorage
- Toutes les routes sont protégées et nécessitent une authentification
- Seuls les administrateurs peuvent accéder au backoffice

## 🐛 Dépannage

### L'API n'est pas accessible
- Vérifiez que l'API backend est démarrée sur le port 3000
- Vérifiez la variable `NEXT_PUBLIC_API_URL` dans `.env.local`
- Vérifiez les paramètres CORS de l'API

### Erreurs de connexion
- Vérifiez que vous utilisez les bons identifiants
- Vérifiez que l'utilisateur a le rôle `admin`
- Vérifiez les logs de l'API pour plus de détails
