import request from 'supertest';
import app from '../server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import Category from '../models/Category.model';
import Component from '../models/Component.model';

describe('Component Routes', () => {
  let adminToken: string;
  let userToken: string;
  let categoryId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://admin:admin123@localhost:27017/configurateurpc_test?authSource=admin';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await Component.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Component.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    // Create category
    const category = await Category.create({
      name: 'Processeurs',
      description: 'CPU',
    });
    categoryId = category._id.toString();

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

  describe('GET /api/components', () => {
    it('devrait retourner la liste des composants', async () => {
      await Component.create([
        {
          category: categoryId,
          title: 'Ryzen 9 7950X',
          brand: 'AMD',
          model: '7950X',
          price: 599,
        },
        {
          category: categoryId,
          title: 'Core i9-13900K',
          brand: 'Intel',
          model: '13900K',
          price: 589,
        },
      ]);

      const response = await request(app).get('/api/components');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('devrait filtrer par catégorie', async () => {
      const otherCategory = await Category.create({
        name: 'Cartes graphiques',
      });
      await Component.create([
        {
          category: categoryId,
          title: 'Ryzen 9 7950X',
          brand: 'AMD',
          model: '7950X',
        },
        {
          category: otherCategory._id,
          title: 'RTX 4090',
          brand: 'NVIDIA',
          model: '4090',
        },
      ]);

      const response = await request(app).get(
        `/api/components?category=${categoryId}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Ryzen 9 7950X');
    });

    it('devrait filtrer par marque', async () => {
      await Component.create([
        {
          category: categoryId,
          title: 'Ryzen 9 7950X',
          brand: 'AMD',
          model: '7950X',
        },
        {
          category: categoryId,
          title: 'Core i9-13900K',
          brand: 'Intel',
          model: '13900K',
        },
      ]);

      const response = await request(app).get('/api/components?brand=AMD');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].brand).toBe('AMD');
    });
  });

  describe('GET /api/components/:id', () => {
    it('devrait retourner un composant par son ID', async () => {
      const component = await Component.create({
        category: categoryId,
        title: 'Ryzen 9 7950X',
        brand: 'AMD',
        model: '7950X',
        price: 599,
      });

      const response = await request(app).get(
        `/api/components/${component._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Ryzen 9 7950X');
      expect(response.body.brand).toBe('AMD');
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/components/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('non trouvé');
    });
  });

  describe('POST /api/components', () => {
    it('devrait créer un composant (admin)', async () => {
      const response = await request(app)
        .post('/api/components')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: categoryId,
          title: 'Ryzen 9 7950X',
          brand: 'AMD',
          model: '7950X',
          description: 'Processeur haut de gamme',
          price: 599,
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Ryzen 9 7950X');
      expect(response.body.price).toBe(599);
    });

    it('devrait refuser sans authentification', async () => {
      const response = await request(app).post('/api/components').send({
        category: categoryId,
        title: 'Test',
        brand: 'Test',
        model: 'Test',
      });

      expect(response.status).toBe(401);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const response = await request(app)
        .post('/api/components')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: categoryId,
          title: 'Test',
          brand: 'Test',
          model: 'Test',
        });

      expect(response.status).toBe(403);
    });

    it('devrait refuser si le titre est manquant', async () => {
      const response = await request(app)
        .post('/api/components')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: categoryId,
          brand: 'AMD',
          model: '7950X',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/components/:id', () => {
    it('devrait mettre à jour un composant (admin)', async () => {
      const component = await Component.create({
        category: categoryId,
        title: 'Ryzen 9 7950X',
        brand: 'AMD',
        model: '7950X',
        price: 599,
      });

      const response = await request(app)
        .put(`/api/components/${component._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Ryzen 9 7950X3D', price: 699 });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Ryzen 9 7950X3D');
      expect(response.body.price).toBe(699);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/components/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test' });

      expect(response.status).toBe(404);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const component = await Component.create({
        category: categoryId,
        title: 'Ryzen 9 7950X',
        brand: 'AMD',
        model: '7950X',
      });

      const response = await request(app)
        .put(`/api/components/${component._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Test' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/components/:id', () => {
    it('devrait supprimer un composant (admin)', async () => {
      const component = await Component.create({
        category: categoryId,
        title: 'Ryzen 9 7950X',
        brand: 'AMD',
        model: '7950X',
      });

      const response = await request(app)
        .delete(`/api/components/${component._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('supprimé');

      const deleted = await Component.findById(component._id);
      expect(deleted).toBeNull();
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/components/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('devrait refuser pour un utilisateur non-admin', async () => {
      const component = await Component.create({
        category: categoryId,
        title: 'Ryzen 9 7950X',
        brand: 'AMD',
        model: '7950X',
      });

      const response = await request(app)
        .delete(`/api/components/${component._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
