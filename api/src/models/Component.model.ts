import mongoose, { Document, Schema } from 'mongoose';

export interface IComponent extends Document {
  category: mongoose.Types.ObjectId;
  title: string;
  brand: string;
  model: string;
  description?: string;
  specifications: Record<string, any>;
  imageUrl?: string;
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

