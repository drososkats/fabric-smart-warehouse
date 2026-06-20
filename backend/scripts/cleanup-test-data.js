require('dotenv').config();
const mongoose = require('mongoose');
const { MONGO_URI } = require('../cloud-services');
const Product = require('../models/Product');

async function cleanup() {
  await mongoose.connect(MONGO_URI);
  const result = await Product.deleteMany({ name: /^TestProduct/ });
  console.log(`✅ Deleted ${result.deletedCount} test products`);
  await mongoose.disconnect();
}

cleanup();