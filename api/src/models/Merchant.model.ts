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

