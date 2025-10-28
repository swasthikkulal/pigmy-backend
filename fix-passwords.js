const mongoose = require('mongoose');
const Collector = require('./models/Collector');
const connectDB = require("./config/database");

// Connect to your database
connectDB()
  .then(async () => {
    console.log('Connected to database');
    
    // Get all collectors
    const collectors = await Collector.find({});
    console.log(`Found ${collectors.length} collectors`);
    
    // Fix each collector
    for (let collector of collectors) {
      console.log(`Fixing: ${collector.name} (Phone: ${collector.phone})`);
      
      // Direct update without validation
      await Collector.updateOne(
        { _id: collector._id },
        { $set: { password: collector.phone } }
      );
    }
    
    console.log('✅ All collectors fixed!');
    console.log('\n📋 Login Credentials:');
    
    // Verify and show credentials
    const fixedCollectors = await Collector.find({});
    fixedCollectors.forEach(collector => {
      console.log(`👤 ${collector.name}`);
      console.log(`   Email: ${collector.email}`);
      console.log(`   Phone: ${collector.phone}`); 
      console.log(`   Password: ${collector.phone}`);
      console.log('   ──────────────────────');
    });
    
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });