/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la catégorie
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Nom de la catégorie
 *           example: "Processeurs"
 *         slug:
 *           type: string
 *           description: Slug auto-généré à partir du nom
 *           example: "processeurs"
 *         description:
 *           type: string
 *           description: Description de la catégorie
 *           example: "Processeurs de bureau et portables"
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

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la catégorie est requis'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name before validation
categorySchema.pre('validate', function (this: ICategory, next: () => void) {
  // Generate slug if name is modified or slug doesn't exist
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export default mongoose.model<ICategory>('Category', categorySchema);

