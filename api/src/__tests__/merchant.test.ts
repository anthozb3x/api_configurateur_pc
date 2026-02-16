import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import Category from '../models/Category.model';
import Component from '../models/Component.model';
import Merchant from '../models/Merchant.model';

describe('Merchant Routes', () => {
  let adminToken: string;
  let userToken: string;
  let componentId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://admin:admin123@localhost:27017/configurateurpc_test?authSource=admin';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await Merchant.deleteMany({});
    await Component.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Merchant.deleteMany({});
    await Component.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    // Create category + component
    const category = await Category.create({ name: 'Processeurs' });
    const component = await Component.create({
      category: category._id,
      title: 'Ryzen 9 7950X',
      brand: 'AMD',
      model: '7950X',
      price: 599,
    });
    componentId = component._id.toString();

    // Create admin
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

  describe('GET /api/merchants', () => {
    it('devrait retourner la liste des marchands actifs', async () => {
      await Merchant.create([
        {
          name: 'Amazon',
          websiteUrl: 'https://www.amazon.fr',
          isActive: true,
        },
        {
          name: 'LDLC',
          websiteUrl: 'https://www.ldlc.com',
          isActive: true,
        },
        {
          name: 'Inactif',
          websiteUrl: 'https://www.inactif.com',
          isActive: false,
        },
      ]);

      const response = await request(app).get('/api/merchants');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('devrait retourner un tableau vide si aucun marchand actif', async () => {
      const response = await request(app).get('/api/merchants');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/merchants/:id', () => {
    it('devrait retourner un marchand par son ID', async () => {
      const merchant = await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
        commissionRate: 5.5,
      });

      const response = await request(app).get(`/api/merchants/${merchant._id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Amazon');
      expect(response.body.commissionRate).toBe(5.5);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/merchants/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('non trouvé');
    });
  });

  describe('POST /api/merchants', () => {
    it('devrait créer un marchand (admin)', async () => {
      const response = await request(app)
        .post('/api/merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Amazon',
          websiteUrl: 'https://www.amazon.fr',
          commissionRate: 5.5,
          affiliationConditions: 'Conditions test',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Amazon');
      expect(response.body.isActive).toBe(true);
    });

    it('devrait refuser sans authentification', async () => {
      const response = await request(app).post('/api/merchants').send({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
      });

      expect(response.status).toBe(401);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const response = await request(app)
        .post('/api/merchants')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Amazon',
          websiteUrl: 'https://www.amazon.fr',
        });

      expect(response.status).toBe(403);
    });

    it('devrait refuser si le nom est manquant', async () => {
      const response = await request(app)
        .post('/api/merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ websiteUrl: 'https://www.amazon.fr' });

      expect(response.status).toBe(400);
    });

    it('devrait refuser un nom en doublon', async () => {
      await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
      });

      const response = await request(app)
        .post('/api/merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Amazon',
          websiteUrl: 'https://www.amazon2.fr',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/merchants/:id/prices', () => {
    it('devrait ajouter un prix pour un composant (admin)', async () => {
      const merchant = await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
      });

      const response = await request(app)
        .post(`/api/merchants/${merchant._id}/prices`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          component: componentId,
          price: 549.99,
          currency: 'EUR',
          url: 'https://www.amazon.fr/product',
        });

      expect(response.status).toBe(200);
      expect(response.body.prices).toHaveLength(1);
      expect(response.body.prices[0].price).toBe(549.99);
    });

    it('devrait mettre à jour un prix existant', async () => {
      const merchant = await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
        prices: [
          {
            component: componentId,
            price: 549.99,
            currency: 'EUR',
            lastUpdated: new Date(),
          },
        ],
      });

      const response = await request(app)
        .post(`/api/merchants/${merchant._id}/prices`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          component: componentId,
          price: 499.99,
        });

      expect(response.status).toBe(200);
      expect(response.body.prices).toHaveLength(1);
      expect(response.body.prices[0].price).toBe(499.99);
    });

    it('devrait retourner 404 pour un marchand inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/merchants/${fakeId}/prices`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          component: componentId,
          price: 549.99,
        });

      expect(response.status).toBe(404);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const merchant = await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
      });

      const response = await request(app)
        .post(`/api/merchants/${merchant._id}/prices`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          component: componentId,
          price: 549.99,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/merchants/:id', () => {
    it('devrait mettre à jour un marchand (admin)', async () => {
      const merchant = await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
      });

      const response = await request(app)
        .put(`/api/merchants/${merchant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Amazon France',
          commissionRate: 7.5,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Amazon France');
      expect(response.body.commissionRate).toBe(7.5);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/merchants/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const merchant = await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
      });

      const response = await request(app)
        .put(`/api/merchants/${merchant._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/merchants/:id', () => {
    it('devrait supprimer un marchand (admin)', async () => {
      const merchant = await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
      });

      const response = await request(app)
        .delete(`/api/merchants/${merchant._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('supprimé');

      const deleted = await Merchant.findById(merchant._id);
      expect(deleted).toBeNull();
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/merchants/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const merchant = await Merchant.create({
        name: 'Amazon',
        websiteUrl: 'https://www.amazon.fr',
      });

      const response = await request(app)
        .delete(`/api/merchants/${merchant._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
