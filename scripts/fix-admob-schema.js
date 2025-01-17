const mongoose = require('mongoose');
require('dotenv').config();

async function fixAdMobSchema() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Get the AdMob collection
        const admobCollection = mongoose.connection.collection('admobs');

        // Drop the old index
        await admobCollection.dropIndex('adUnitId_1');
        console.log('Dropped old adUnitId index');

        // Create new index
        await admobCollection.createIndex({ adUnitCode: 1 }, { unique: true });
        console.log('Created new adUnitCode index');

        // Update all documents to ensure they have adUnitCode
        await admobCollection.updateMany(
            { adUnitCode: { $exists: false } },
            { $set: { adUnitCode: null } }
        );
        console.log('Updated documents without adUnitCode');

        // Remove adUnitId field from all documents
        await admobCollection.updateMany(
            {},
            { $unset: { adUnitId: "" } }
        );
        console.log('Removed adUnitId field from all documents');

        console.log('Schema fix completed successfully');
    } catch (error) {
        console.error('Error fixing schema:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixAdMobSchema();
