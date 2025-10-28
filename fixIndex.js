const mongoose = require('mongoose');

async function dropIndex() {
    try {
        console.log('🔧 Attempting to fix MongoDB index issue...');
        
        // Connect to your database - use the same connection string as your app
        await mongoose.connect('mongodb://127.0.0.1:27017/pigmy', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Get the accounts collection
        const collection = mongoose.connection.collection('accounts');

        // List current indexes
        console.log('📋 Current indexes:');
        const indexes = await collection.getIndexes();
        console.log(Object.keys(indexes));

        // Check if the problematic index exists
        if (indexes.accountId_1) {
            console.log('🚨 Found problematic index: accountId_1');
            
            // Drop the accountId_1 index
            await collection.dropIndex('accountId_1');
            console.log('✅ Successfully dropped accountId_1 index');
        } else {
            console.log('✅ No accountId_1 index found');
        }

        // List indexes again to verify
        console.log('📋 Updated indexes:');
        const updatedIndexes = await collection.getIndexes();
        console.log(Object.keys(updatedIndexes));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔒 Connection closed');
        process.exit(0);
    }
}

dropIndex();