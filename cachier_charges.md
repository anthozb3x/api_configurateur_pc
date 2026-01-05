# Projet API

## Contexte

Le site internet ConfigurateurPC.com souhaite développer sa propre API pour permettre à d'autres
clients de créer des applications de configuration de PC sur mesure. Cette API permettra aux
utilisateurs de sélectionner des composants matériels, de calculer le coût total et de générer une
liste de composants pour l'assemblage.

## Objectifs

L'objectif est de créer une API RESTful en Node.js qui répond aux besoins suivants :

**1. Gestion des Catégories et des Composants Matériels :**
    - Catégories de composants : Lister les catégories de composants (CPU, GPU, RAM,
       stockage, carte mère, boîtier, alimentation, etc.).
    - Composants disponibles : Lister les composants disponibles dans chaque catégorie avec
       leurs spécifications (marque, titre, prix, etc.).
    - Détail d’un composant : Afficher le détail d’un composant.
    - Ajout/Mise à Jour/Suppression : Permettre aux administrateurs d'ajouter, mettre à jour
       ou supprimer des composants.
**2. Gestion des Partenaires Marchands et des Coûts :**
    - Partenaires marchants : Lister pour chaque composant les prix proposés par les
       partenaires marchands.
    - Calcul du Coût Total : Calculer le coût total de la configuration en fonction des
       composants sélectionnés.
    - Ajout/Mise à Jour/Suppression : Permettre aux administrateurs d'ajouter, mettre à jour
       ou supprimer des partenaires marchands ainsi que les prix communiqués pour chaque
       composant.
**3. Génération de Configuration :**
    - Liste des Composants : Générer une liste détaillée des composants sélectionnés pour
       l'assemblage.
    - Exportation : Exporter la liste au format PDF.
**4. Gestion des Utilisateurs :**
    - Inscription et Connexion : Permettre aux utilisateurs de s'inscrire et de se connecter.
    - Sauvegarde des configurations : Sauvegarder et gérer plusieurs configurations de PC par
       utilisateur.

Remarque : La première version de l’API ne prend pas en compte la vérification de compatibilité.


L’API devra être sécurisée avec un système d’authentification par jetons JWT.

Des tests unitaires devront être réalisés afin de vérifier le bon fonctionnent de tous les endpoints de
l’API.

Une documentation de l’API devra être fournie en utilisant le standard OpenAPI.

**ConfigurateurPC** souhaite fourni en option aux clients une interface permettant aux administrateurs
de gérer les composants, les sites marchands et les configurations des utilisateurs :

**1. Gestion des Composants**
    - Liste des composants : Une interface qui liste tous les composants disponibles, avec des
       filtres pour rechercher par catégorie (CPU, GPU, RAM, etc.), et marque.
    - Ajout de composants : Un formulaire pour ajouter de nouveaux composants avec des
       champs pour la catégorie, le titre, la description, le modèle, les spécifications techniques, et
       une image du produit.
    - Mise à Jour de composants : Une interface pour modifier les informations des composants
       existants, avec des champs pré-remplis pour faciliter les modifications.
    - Suppression de composants : Option pour supprimer des composants de la base de données,
       avec une confirmation pour éviter les suppressions accidentelles.
**2. Gestion des Utilisateurs**
    - Liste des utilisateurs : Une interface qui liste tous les utilisateurs inscrits, avec des filtres pour
       rechercher par nom, email.
    - Détails de l'Utilisateur : Une page détaillée pour chaque utilisateur, affichant leurs
       informations de profil, leurs configurations sauvegardées.
**3. Gestion des Configurations**
    - Liste des Configurations : Une interface qui liste toutes les configurations de PC sauvegardées
       par les utilisateurs, avec des filtres pour rechercher par utilisateur, date.
    - Détails de la Configuration : Une page détaillée pour chaque configuration, affichant la liste
       des composants sélectionnés, le coût total.
    - Modification des Configurations : Option pour les administrateurs de modifier ou supprimer
       des configurations sauvegardées par les utilisateurs.
**4. Gestion des Partenaires Marchands**
    - Liste des Partenaires : Une interface qui liste tous les sites marchands partenaires.
    - Ajout de Partenaires : Un formulaire pour ajouter de nouveaux partenaires marchands, avec
       des champs pour le nom du site, l'URL, les informations de synchronisation des prix, et les
       détails du programme d'affiliation (taux de commission, conditions, etc.).
    - Mise à Jour des Partenaires : Une interface pour modifier les informations des partenaires
       existants, avec des champs pré-remplis pour faciliter les modifications.
    - Suppression de Partenaires : Option pour supprimer des partenaires de la liste, avec une
       confirmation pour éviter les suppressions accidentelles.


**5. Sécurité et Authentification**

Connexion Sécurisée : Formulaire de connexion sécurisé pour les administrateurs.

Cette interface utilisera l’API.

## Technologies à Utiliser

- API : Node.js, Express.js, MongoDB, TS.
- BackOffice : Nextjs, TS.
- Authentification : JWT (JSON Web Tokens).
- Tests : Jest et Supertest pour les tests de l’API.

 Une documentation de l’API complète et lisible par une machine (par exemple, OpenAPI/SWAGGER) :
    tous les endpoints, opérations et formats de données.


