import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import Category from '../models/Category.model';
import Component from '../models/Component.model';
import Configuration from '../models/Configuration.model';

describe('User Routes', () => {
  let adminToken: string;
  let adminId: string;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://admin:admin123@localhost:27017/configurateurpc_test?authSource=admin';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await Configuration.deleteMany({});
    await Component.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Configuration.deleteMany({});
    await Component.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    // Create admin
    const admin = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
    adminId = admin._id.toString();
    adminToken = jwt.sign(
      { userId: adminId },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create regular user
    const user = await User.create({
      email: 'user@test.com',
      password: 'password123',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'user',
    });
    userId = user._id.toString();
    userToken = jwt.sign(
      { userId: userId },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  describe('GET /api/users', () => {
    it('devrait retourner la liste des utilisateurs (admin)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      // Password should not be included
      response.body.forEach((user: any) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('devrait filtrer par recherche', async () => {
      const response = await request(app)
        .get('/api/users?search=Jean')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].firstName).toBe('Jean');
    });

    it('devrait filtrer par email', async () => {
      const response = await request(app)
        .get('/api/users?search=admin@test.com')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].email).toBe('admin@test.com');
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('devrait refuser sans authentification', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('devrait retourner un utilisateur avec ses configurations (admin)', async () => {
      // Create a config for the user
      const category = await Category.create({ name: 'Processeurs' });
      const component = await Component.create({
        category: category._id,
        title: 'Ryzen 9',
        brand: 'AMD',
        model: '7950X',
        price: 599,
      });
      await Configuration.create({
        user: userId,
        name: 'PC Gaming',
        components: [{ component: component._id, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.firstName).toBe('Jean');
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.configurations).toHaveLength(1);
      expect(response.body.configurations[0].name).toBe('PC Gaming');
    });

    it('devrait permettre à un utilisateur de voir son propre profil', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.firstName).toBe('Jean');
    });

    it('devrait refuser l\'accès au profil d\'un autre utilisateur (non-admin)', async () => {
      const response = await request(app)
        .get(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('devrait retourner 404 pour un utilisateur inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
