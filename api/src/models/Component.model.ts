/**
 * @swagger
 * components:
 *   schemas:
 *     Component:
 *       type: object
 *       required:
 *         - category
 *         - title
 *         - brand
 *         - model
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du composant
 *           example: "507f1f77bcf86cd799439011"
 *         category:
 *           type: string
 *           description: ID de la catégorie (ref Category)
 *           example: "507f1f77bcf86cd799439012"
 *         title:
 *           type: string
 *           description: Titre du composant
 *           example: "AMD Ryzen 9 7950X"
 *         brand:
 *           type: string
 *           description: Marque du composant
 *           example: "AMD"
 *         model:
 *           type: string
 *           description: Modèle du composant
 *           example: "7950X"
 *         description:
 *           type: string
 *           description: Description du composant
 *           example: "Processeur 16 coeurs / 32 threads"
 *         specifications:
 *           type: object
 *           additionalProperties: true
 *           description: Spécifications techniques (clé-valeur)
 *           example: { "cores": 16, "threads": 32, "socket": "AM5" }
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: URL de l'image du composant
 *           example: "https://example.com/ryzen9.jpg"
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Prix par défaut du composant
 *           example: 599.99
 *         currency:
 *           type: string
 *           default: EUR
 *           description: Devise du prix
 *           example: "EUR"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière modification
 */
import mongoose, { Schema } from 'mongoose';

export interface IComponent {
  category: mongoose.Types.ObjectId;
  title: string;
  brand: string;
  model: string;
  description?: string;
  specifications: Record<string, any>;
  imageUrl?: string;
  price?: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

const componentSchema = new Schema<IComponent>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La catégorie est requise'],
    },
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'La marque est requise'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Le modèle est requis'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    specifications: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: [0, 'Le prix doit être positif'],
    },
    currency: {
      type: String,
      default: 'EUR',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
componentSchema.index({ title: 'text', brand: 'text', model: 'text' });
componentSchema.index({ category: 1 });
componentSchema.index({ brand: 1 });

export default mongoose.model<IComponent>('Component', componentSchema);

