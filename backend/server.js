const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./models/User'); 
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Admin Seeder Function with verbose logging
const seedAdmin = async () => {
  try {
    console.log('🔍 Checking database for existing Admin...');
    const adminExists = await User.findOne({ role: 'Admin' });
    
    if (!adminExists) {
      console.log('⏳ No admin found. Attempting to create one...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = await User.create({
        name: 'Master Admin',
        email: 'admin@edms.com',
        password: hashedPassword,
        role: 'Admin'
      });
      
      console.log('✅ Default Admin seeded successfully:', newAdmin.email);
    } else {
      console.log('✅ Admin already exists in the database. Skipping creation.');
    }
  } catch (error) {
    console.error('❌ FATAL ERROR seeding admin:', error.message);
  }
};

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas Connected Successfully');
    seedAdmin(); // Call the seeder after successful connection
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Include your API routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// ==========================================
// 🚀 UNIFIED DEPLOYMENT LOGIC
// ==========================================
// Serve the compiled React frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to hand off routing to the React frontend
// FIXED: Express 5 requires '/(.*)' instead of '*'
app.get('/(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
