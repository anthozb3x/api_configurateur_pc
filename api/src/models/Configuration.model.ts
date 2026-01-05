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

