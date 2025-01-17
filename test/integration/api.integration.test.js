const mongoose = require('mongoose');
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server');
const Template = require('../../models/Template');
const AdMob = require('../../models/AdMob');
const SharedFile = require('../../models/SharedFile');

describe('API Integration Tests', () => {
    before(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    });

    after(async () => {
        // Clean up database
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear all collections before each test
        await Template.deleteMany({});
        await AdMob.deleteMany({});
        await SharedFile.deleteMany({});
    });

    describe('Template API', () => {
        it('should create and retrieve a template', async () => {
            const templateData = {
                title: 'Test Template',
                content: '<p>Test content</p>',
                category: 'Test Category',
                tags: ['test', 'template']
            };

            // Create template
            const createRes = await request(app)
                .post('/api/templates')
                .send(templateData)
                .expect(201);

            expect(createRes.body).to.have.property('_id');
            expect(createRes.body.title).to.equal(templateData.title);

            // Retrieve template
            const getRes = await request(app)
                .get(`/api/templates/${createRes.body._id}`)
                .expect(200);

            expect(getRes.body.title).to.equal(templateData.title);
        });

        it('should handle template validation errors', async () => {
            const invalidTemplate = {
                // Missing required title
                content: '<p>Test content</p>'
            };

            const res = await request(app)
                .post('/api/templates')
                .send(invalidTemplate)
                .expect(400);

            expect(res.body).to.have.property('error');
        });

        it('should update a template', async () => {
            // Create template
            const template = await Template.create({
                title: 'Original Title',
                content: '<p>Original content</p>',
                category: 'Test'
            });

            // Update template
            const updateData = {
                title: 'Updated Title',
                content: '<p>Updated content</p>'
            };

            const res = await request(app)
                .put(`/api/templates/${template._id}`)
                .send(updateData)
                .expect(200);

            expect(res.body.title).to.equal(updateData.title);
            expect(res.body.content).to.equal(updateData.content);
        });
    });

    describe('AdMob API', () => {
        it('should create and manage AdMob units', async () => {
            const adMobData = {
                adUnitName: 'Test Ad Unit',
                adUnitCode: 'test_ad_unit_' + Date.now(),
                adType: 'banner',
                description: 'Test description'
            };

            // Create AdMob unit
            const createRes = await request(app)
                .post('/api/admob')
                .send(adMobData)
                .expect(201);

            expect(createRes.body).to.have.property('_id');
            expect(createRes.body.adUnitName).to.equal(adMobData.adUnitName);

            // Update AdMob unit
            const updateData = {
                adUnitName: 'Updated Ad Unit',
                description: 'Updated description'
            };

            const updateRes = await request(app)
                .put(`/api/admob/${createRes.body._id}`)
                .send(updateData)
                .expect(200);

            expect(updateRes.body.adUnitName).to.equal(updateData.adUnitName);
        });

        it('should validate AdMob unit codes', async () => {
            const invalidAdMob = {
                adUnitName: 'Test Ad Unit',
                adType: 'invalid_type' // Invalid ad type
            };

            const res = await request(app)
                .post('/api/admob')
                .send(invalidAdMob)
                .expect(400);

            expect(res.body).to.have.property('error');
        });
    });

    describe('File API', () => {
        it('should handle file uploads', async () => {
            const buffer = Buffer.from('test file content');
            
            const res = await request(app)
                .post('/api/files')
                .attach('file', buffer, 'test.txt')
                .field('description', 'Test file description')
                .expect(201);

            expect(res.body).to.have.property('_id');
            expect(res.body).to.have.property('filename');
            expect(res.body.description).to.equal('Test file description');
        });

        it('should list uploaded files', async () => {
            // Create test file record
            await SharedFile.create({
                filename: 'test.txt',
                originalname: 'test.txt',
                path: '/uploads/test.txt',
                description: 'Test file'
            });

            const res = await request(app)
                .get('/api/files')
                .expect(200);

            expect(res.body).to.have.property('files');
            expect(res.body.files).to.be.an('array');
            expect(res.body.files.length).to.be.greaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle 404 errors', async () => {
            await request(app)
                .get('/api/nonexistent')
                .expect(404);
        });

        it('should handle invalid ObjectIds', async () => {
            await request(app)
                .get('/api/templates/invalid-id')
                .expect(400);
        });

        it('should handle server errors gracefully', async () => {
            // Temporarily break the database connection
            await mongoose.connection.close();

            const res = await request(app)
                .get('/api/templates')
                .expect(500);

            expect(res.body).to.have.property('error');

            // Restore connection for other tests
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
        });
    });
});
