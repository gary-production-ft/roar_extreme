import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema(
  {
    foodId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['grain', 'millet', 'pulse', 'pulse_flour', 'soy', 'nuts_seeds', 'dairy', 'egg', 'poultry', 'fish', 'fruit', 'vegetable', 'fat', 'seasoning', 'beverage'],
      required: true,
      index: true,
    },
    dietTags: [{
      type: String,
      enum: ['vegetarian', 'lacto_vegetarian', 'ovo_vegetarian', 'vegan', 'non_vegetarian', 'eggetarian'],
      index: true,
    }],
    foodState: { type: String, default: 'raw' }, // raw, cooked, as_sold, dry
    nutrientsPer100g: {
      energyKcal: { type: Number, required: true },
      proteinG: { type: Number, required: true },
      carbohydrateG: { type: Number, required: true },
      totalFatG: { type: Number, required: true },
      dietaryFibreG: { type: Number, default: 0 },
      source: { type: String, default: 'ICMR-NIN IFCT 2017' },
      foodCode: { type: String },
    },
    allergens: [{ type: String }], // 'dairy', 'peanuts', 'gluten', 'soy', 'egg', 'fish'
    isRegionalMaharashtrian: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const FoodItem = mongoose.model('FoodItem', foodItemSchema);
