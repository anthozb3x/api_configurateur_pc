/**
 * @swagger
 * components:
 *   schemas:
 *     ConfigurationComponent:
 *       type: object
 *       required:
 *         - component
 *         - quantity
 *       properties:
 *         component:
 *           type: string
 *           description: ID du composant (ref Component)
 *           example: "507f1f77bcf86cd799439011"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Quantité de ce composant
 *           example: 1
 *         selectedMerchant:
 *           type: string
 *           description: ID du marchand sélectionné (ref Merchant)
 *           example: "507f1f77bcf86cd799439013"
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Prix unitaire résolu
 *           example: 549.99
 *     Configuration:
 *       type: object
 *       required:
 *         - user
 *         - name
 *         - components
 *         - totalCost
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la configuration
 *           example: "507f1f77bcf86cd799439011"
 *         user:
 *           type: string
 *           description: ID de l'utilisateur propriétaire (ref User)
 *           example: "507f1f77bcf86cd799439012"
 *         name:
 *           type: string
 *           description: Nom de la configuration
 *           example: "PC Gaming Haut de Gamme"
 *         components:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConfigurationComponent'
 *           description: Liste des composants de la configuration
 *         totalCost:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           description: Coût total calculé automatiquement
 *           example: 2499.99
 *         currency:
 *           type: string
 *           default: EUR
 *           description: Devise du coût total
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
import mongoose, { Document, Schema } from 'mongoose';

export interface IConfigurationComponent {
  component: mongoose.Types.ObjectId;
  quantity: number;
  selectedMerchant?: mongoose.Types.ObjectId;
  price?: number;
}

export interface IConfiguration extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  components: IConfigurationComponent[];
  totalCost: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const configurationComponentSchema = new Schema<IConfigurationComponent>(
  {
    component: {
      type: Schema.Types.ObjectId,
      ref: 'Component',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'La quantité doit être au moins 1'],
      default: 1,
    },
    selectedMerchant: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
    },
    price: {
      type: Number,
      min: [0, 'Le prix doit être positif'],
    },
  },
  { _id: false }
);

const configurationSchema = new Schema<IConfiguration>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'utilisateur est requis"],
    },
    name: {
      type: String,
      required: [true, 'Le nom de la configuration est requis'],
      trim: true,
    },
    components: [configurationComponentSchema],
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Le coût total doit être positif'],
      default: 0,
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

// Index for user queries
configurationSchema.index({ user: 1 });
configurationSchema.index({ createdAt: -1 });

export default mongoose.model<IConfiguration>('Configuration', configurationSchema);

