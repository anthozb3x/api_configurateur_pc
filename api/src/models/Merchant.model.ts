/**
 * @swagger
 * components:
 *   schemas:
 *     Price:
 *       type: object
 *       required:
 *         - component
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du prix
 *           example: "507f1f77bcf86cd799439011"
 *         component:
 *           type: string
 *           description: ID du composant (ref Component)
 *           example: "507f1f77bcf86cd799439012"
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Prix du composant chez ce marchand
 *           example: 549.99
 *         currency:
 *           type: string
 *           default: EUR
 *           description: Devise du prix
 *           example: "EUR"
 *         url:
 *           type: string
 *           format: uri
 *           description: URL de la page produit chez le marchand
 *           example: "https://www.amazon.fr/product/123"
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour du prix
 *     Merchant:
 *       type: object
 *       required:
 *         - name
 *         - websiteUrl
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du marchand
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Nom du partenaire marchand
 *           example: "Amazon"
 *         websiteUrl:
 *           type: string
 *           format: uri
 *           description: URL du site web du marchand
 *           example: "https://www.amazon.fr"
 *         logoUrl:
 *           type: string
 *           format: uri
 *           description: URL du logo du marchand
 *           example: "https://example.com/amazon-logo.png"
 *         prices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Price'
 *           description: Liste des prix des composants
 *         commissionRate:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Taux de commission en pourcentage
 *           example: 5.5
 *         affiliationConditions:
 *           type: string
 *           description: Conditions d'affiliation
 *           example: "Commission sur ventes via lien affilié"
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Statut actif du partenaire
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière modification
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IPrice extends Document {
  component: mongoose.Types.ObjectId;
  price: number;
  currency: string;
  url?: string;
  lastUpdated: Date;
}

export interface IMerchant extends Document {
  name: string;
  websiteUrl: string;
  logoUrl?: string;
  prices: IPrice[];
  commissionRate?: number;
  affiliationConditions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const priceSchema = new Schema<IPrice>(
  {
    component: {
      type: Schema.Types.ObjectId,
      ref: 'Component',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Le prix est requis'],
      min: [0, 'Le prix doit être positif'],
    },
    currency: {
      type: String,
      default: 'EUR',
      uppercase: true,
    },
    url: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const merchantSchema = new Schema<IMerchant>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du partenaire est requis'],
      unique: true,
      trim: true,
    },
    websiteUrl: {
      type: String,
      required: [true, "L'URL du site est requise"],
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    prices: [priceSchema],
    commissionRate: {
      type: Number,
      min: [0, 'Le taux de commission doit être positif'],
      max: [100, 'Le taux de commission ne peut pas dépasser 100%'],
    },
    affiliationConditions: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMerchant>('Merchant', merchantSchema);

