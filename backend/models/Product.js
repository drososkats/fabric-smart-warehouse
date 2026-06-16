const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "T-shirt/top",
        "Trouser",
        "Pullover",
        "Dress",
        "Coat",
        "Sandal",
        "Shirt",
        "Sneaker",
        "Bag",
        "Ankle boot",
      ],
    },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    createdBy: { type: String }, 
    image: { type: String },
    invoice: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", ProductSchema);
