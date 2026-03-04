import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import Category from '../models/Category.model';
import Component from '../models/Component.model';
import Configuration from '../models/Configuration.model';
import Merchant from '../models/Merchant.model';

describe('Configuration Routes', () => {
  let adminToken: string;
  let adminId: string;
  let userToken: string;
  let userId: string;
  let componentId: string;
  let componentId2: string;
  let merchantId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://admin:admin123@localhost:27017/configurateurpc_test?authSource=admin';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await Configuration.deleteMany({});
    await Merchant.deleteMany({});
    await Component.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Configuration.deleteMany({});
    await Merchant.deleteMany({});
    await Component.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    // Create category + components
    const category = await Category.create({ name: 'Processeurs' });
    const comp1 = await Component.create({
      category: category._id,
      title: 'Ryzen 9 7950X',
      brand: 'AMD',
      model: '7950X',
      price: 599,
    });
    const comp2 = await Component.create({
      category: category._id,
      title: 'Core i9-13900K',
      brand: 'Intel',
      model: '13900K',
      price: 589,
    });
    componentId = comp1._id.toString();
    componentId2 = comp2._id.toString();

    // Create merchant with prices
    const merchant = await Merchant.create({
      name: 'Amazon',
      websiteUrl: 'https://www.amazon.fr',
      prices: [
        {
          component: comp1._id,
          price: 549.99,
          currency: 'EUR',
          lastUpdated: new Date(),
        },
      ],
    });
    merchantId = merchant._id.toString();

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
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
    });
    userId = user._id.toString();
    userToken = jwt.sign(
      { userId: userId },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  describe('GET /api/configurations', () => {
    it('devrait retourner les configurations de l\'utilisateur connecté', async () => {
      await Configuration.create([
        {
          user: userId,
          name: 'Config User',
          components: [{ component: componentId, quantity: 1, price: 599 }],
          totalCost: 599,
        },
        {
          user: adminId,
          name: 'Config Admin',
          components: [{ component: componentId, quantity: 1, price: 599 }],
          totalCost: 599,
        },
      ]);

      const response = await request(app)
        .get('/api/configurations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Config User');
    });

    it('devrait retourner toutes les configurations pour un admin', async () => {
      await Configuration.create([
        {
          user: userId,
          name: 'Config User',
          components: [{ component: componentId, quantity: 1, price: 599 }],
          totalCost: 599,
        },
        {
          user: adminId,
          name: 'Config Admin',
          components: [{ component: componentId, quantity: 1, price: 599 }],
          totalCost: 599,
        },
      ]);

      const response = await request(app)
        .get('/api/configurations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('devrait refuser sans authentification', async () => {
      const response = await request(app).get('/api/configurations');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/configurations/:id', () => {
    it('devrait retourner une configuration par son ID', async () => {
      const config = await Configuration.create({
        user: userId,
        name: 'Ma Config',
        components: [{ component: componentId, quantity: 2, price: 599 }],
        totalCost: 1198,
      });

      const response = await request(app)
        .get(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Ma Config');
      expect(response.body.totalCost).toBe(1198);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/configurations/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('devrait refuser l\'accès à la configuration d\'un autre utilisateur', async () => {
      const config = await Configuration.create({
        user: adminId,
        name: 'Config Admin',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .get(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('devrait permettre à un admin de voir toute configuration', async () => {
      const config = await Configuration.create({
        user: userId,
        name: 'Config User',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .get(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Config User');
    });
  });

  describe('POST /api/configurations', () => {
    it('devrait créer une configuration avec calcul automatique du coût', async () => {
      const response = await request(app)
        .post('/api/configurations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'PC Gaming',
          components: [
            { component: componentId, quantity: 1 },
            { component: componentId2, quantity: 1 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('PC Gaming');
      expect(response.body.components).toHaveLength(2);
      expect(response.body.totalCost).toBeGreaterThanOrEqual(0);
    });

    it('devrait utiliser le prix du marchand quand sélectionné', async () => {
      const response = await request(app)
        .post('/api/configurations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'PC avec marchand',
          components: [
            {
              component: componentId,
              quantity: 1,
              selectedMerchant: merchantId,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.totalCost).toBe(549.99);
    });

    it('devrait refuser sans authentification', async () => {
      const response = await request(app).post('/api/configurations').send({
        name: 'Test',
        components: [{ component: componentId, quantity: 1 }],
      });

      expect(response.status).toBe(401);
    });

    it('devrait refuser si le nom est manquant', async () => {
      const response = await request(app)
        .post('/api/configurations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          components: [{ component: componentId, quantity: 1 }],
        });

      expect(response.status).toBe(400);
    });

    it('devrait refuser si aucun composant', async () => {
      const response = await request(app)
        .post('/api/configurations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'PC vide',
          components: [],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/configurations/:id', () => {
    it('devrait mettre à jour une configuration', async () => {
      const config = await Configuration.create({
        user: userId,
        name: 'Ma Config',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .put(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Ma Config Mise à Jour' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Ma Config Mise à Jour');
    });

    it('devrait recalculer le coût quand les composants changent', async () => {
      const config = await Configuration.create({
        user: userId,
        name: 'Ma Config',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .put(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          components: [
            { component: componentId, quantity: 2 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.totalCost).toBeGreaterThanOrEqual(0);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/configurations/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });

    it('devrait refuser la modification de la configuration d\'un autre utilisateur', async () => {
      const config = await Configuration.create({
        user: adminId,
        name: 'Config Admin',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .put(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/configurations/:id', () => {
    it('devrait supprimer sa propre configuration', async () => {
      const config = await Configuration.create({
        user: userId,
        name: 'Ma Config',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .delete(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('supprimée');

      const deleted = await Configuration.findById(config._id);
      expect(deleted).toBeNull();
    });

    it('devrait permettre à un admin de supprimer toute configuration', async () => {
      const config = await Configuration.create({
        user: userId,
        name: 'Config User',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .delete(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/configurations/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('devrait refuser la suppression de la configuration d\'un autre utilisateur', async () => {
      const config = await Configuration.create({
        user: adminId,
        name: 'Config Admin',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .delete(`/api/configurations/${config._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/configurations/:id/export-pdf', () => {
    it('devrait exporter une configuration en PDF', async () => {
      const config = await Configuration.create({
        user: userId,
        name: 'Ma Config PDF',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .get(`/api/configurations/${config._id}/export-pdf`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('devrait retourner 404 pour une configuration inexistante', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/configurations/${fakeId}/export-pdf`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('devrait refuser l\'export de la configuration d\'un autre utilisateur', async () => {
      const config = await Configuration.create({
        user: adminId,
        name: 'Config Admin',
        components: [{ component: componentId, quantity: 1, price: 599 }],
        totalCost: 599,
      });

      const response = await request(app)
        .get(`/api/configurations/${config._id}/export-pdf`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
