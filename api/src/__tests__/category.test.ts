import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import Category from '../models/Category.model';

describe('Category Routes', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://admin:admin123@localhost:27017/configurateurpc_test?authSource=admin';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await Category.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
    await User.deleteMany({});

    // Create admin user
    const admin = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
    adminToken = jwt.sign(
      { userId: admin._id.toString() },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create regular user
    const user = await User.create({
      email: 'user@test.com',
      password: 'password123',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
    });
    userToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  describe('GET /api/categories', () => {
    it('devrait retourner la liste des catégories', async () => {
      await Category.create([
        { name: 'Processeurs', description: 'CPU' },
        { name: 'Cartes graphiques', description: 'GPU' },
      ]);

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      // Sorted by name
      expect(response.body[0].name).toBe('Cartes graphiques');
      expect(response.body[1].name).toBe('Processeurs');
    });

    it('devrait retourner un tableau vide si aucune catégorie', async () => {
      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('devrait retourner une catégorie par son ID', async () => {
      const category = await Category.create({
        name: 'Processeurs',
        description: 'CPU',
      });

      const response = await request(app).get(`/api/categories/${category._id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Processeurs');
      expect(response.body.slug).toBe('processeurs');
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/categories/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('non trouvée');
    });
  });

  describe('POST /api/categories', () => {
    it('devrait créer une catégorie (admin)', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Processeurs', description: 'CPU' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Processeurs');
      expect(response.body.slug).toBe('processeurs');
    });

    it('devrait refuser sans authentification', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Processeurs' });

      expect(response.status).toBe(401);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Processeurs' });

      expect(response.status).toBe(403);
    });

    it('devrait refuser si le nom est manquant', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'test' });

      expect(response.status).toBe(400);
    });

    it('devrait refuser un nom en doublon', async () => {
      await Category.create({ name: 'Processeurs' });

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Processeurs' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('devrait mettre à jour une catégorie (admin)', async () => {
      const category = await Category.create({ name: 'Processeurs' });

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CPU', description: 'Processeurs mis à jour' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('CPU');
      expect(response.body.description).toBe('Processeurs mis à jour');
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CPU' });

      expect(response.status).toBe(404);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const category = await Category.create({ name: 'Processeurs' });

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'CPU' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('devrait supprimer une catégorie (admin)', async () => {
      const category = await Category.create({ name: 'Processeurs' });

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('supprimée');

      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const category = await Category.create({ name: 'Processeurs' });

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
