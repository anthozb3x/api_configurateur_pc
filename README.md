# ConfigurateurPC

Application de configuration de PC : catalogue de composants, comparaison de prix entre marchands, export PDF. API REST Node.js/Express/TypeScript + frontend d'administration Next.js.

---

## Démarrage rapide (Docker)

**Prérequis :** Docker Desktop installé et lancé.

```bash
docker compose up
```

C'est tout. Les trois services démarrent automatiquement :

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3001        |
| API        | http://localhost:3000/api    |
| Swagger UI | http://localhost:3000/api-docs |

Les données de démonstration sont chargées automatiquement.

### Comptes disponibles

| Email                          | Mot de passe  | Rôle  |
|-------------------------------|---------------|-------|
| `admin@configurateurpc.com`   | `admin123`    | admin |
| `jean.dupont@example.com`     | `password123` | user  |
| `marie.martin@example.com`    | `password123` | user  |
| `pierre.bernard@example.com`  | `password123` | user  |

---

## Développement local (sans Docker)

**Prérequis :** Node.js v18+, npm, Docker (pour MongoDB uniquement).

### 1. Démarrer MongoDB

```bash
docker compose up mongodb -d
```

### 2. Installer les dépendances

```bash
cd api && npm install
cd ../frontend/configurateur_pc_frontend && npm install
```

### 3. Variables d'environnement

```bash
cp api/.env.example api/.env
cp frontend/configurateur_pc_frontend/.env.example frontend/configurateur_pc_frontend/.env.local
```

Les valeurs par défaut fonctionnent sans modification pour un environnement local.

### 4. Lancer les serveurs

```bash
# Terminal 1 — API (port 3000)
cd api && npm run dev

# Terminal 2 — Frontend (port 3001)
cd frontend/configurateur_pc_frontend && npm run dev
```

---

## Scripts

### API (`api/`)

| Commande                  | Description                              |
|---------------------------|------------------------------------------|
| `npm run dev`             | Serveur de développement                 |
| `npm run build`           | Compilation TypeScript                   |
| `npm test`                | Tests Jest                               |
| `npm run test:coverage`   | Tests avec couverture de code            |
| `npm run lint`            | ESLint                                   |
| `npm run format`          | Prettier                                 |
| `npm run init:admin`      | Créer l'utilisateur admin                |
| `npm run createmocks`     | Repeupler la base avec les données de test |

### Frontend (`frontend/configurateur_pc_frontend/`)

| Commande          | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Serveur Next.js          |
| `npm run build`   | Build de production      |
| `npm run lint`    | ESLint                   |

---

## Tests

```bash
cd api && npm test
```

Fichier unique :

```bash
cd api && npx jest src/__tests__/auth.test.ts
```

---

## Stack

| Couche          | Technologies                                      |
|-----------------|---------------------------------------------------|
| API             | Node.js, Express, TypeScript, Mongoose            |
| Frontend        | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui   |
| Base de données | MongoDB 7.0                                       |
| Auth            | JWT, bcrypt                                       |
| Documentation   | Swagger / OpenAPI 3.0                             |
| Tests           | Jest, Supertest                                   |
