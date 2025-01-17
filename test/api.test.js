const axios = require('axios');
const { expect } = require('chai');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

describe('API Tests', () => {
    let templateId;
    let adMobId;
    let fileId;

    // Template Tests
    describe('Templates API', () => {
        it('should create a new template', async () => {
            const response = await axios.post(`${API_URL}/templates`, {
                title: 'Test Template',
                content: '<p>Test content</p>',
                category: 'Test Category',
                tags: ['test', 'template']
            });
            expect(response.status).to.equal(201);
            expect(response.data).to.have.property('_id');
            templateId = response.data._id;
        });

        it('should get all templates', async () => {
            const response = await axios.get(`${API_URL}/templates`);
            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('templates');
            expect(response.data.templates).to.be.an('array');
        });

        it('should update a template', async () => {
            const response = await axios.put(`${API_URL}/templates/${templateId}`, {
                title: 'Updated Template'
            });
            expect(response.status).to.equal(200);
            expect(response.data.title).to.equal('Updated Template');
        });

        it('should delete a template', async () => {
            const response = await axios.delete(`${API_URL}/templates/${templateId}`);
            expect(response.status).to.equal(200);
        });
    });

    // AdMob Tests
    describe('AdMob API', () => {
        it('should create a new AdMob unit', async () => {
            const response = await axios.post(`${API_URL}/admob`, {
                adUnitName: 'Test Ad Unit',
                adUnitCode: 'test_ad_unit_' + Date.now(),
                adType: 'banner',
                description: 'Test description'
            });
            expect(response.status).to.equal(201);
            expect(response.data).to.have.property('_id');
            adMobId = response.data._id;
        });

        it('should get all AdMob units', async () => {
            const response = await axios.get(`${API_URL}/admob`);
            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('adMobs');
            expect(response.data.adMobs).to.be.an('array');
        });

        it('should update an AdMob unit', async () => {
            const response = await axios.put(`${API_URL}/admob/${adMobId}`, {
                adUnitName: 'Updated Ad Unit'
            });
            expect(response.status).to.equal(200);
            expect(response.data.adUnitName).to.equal('Updated Ad Unit');
        });

        it('should delete an AdMob unit', async () => {
            const response = await axios.delete(`${API_URL}/admob/${adMobId}`);
            expect(response.status).to.equal(200);
        });
    });

    // Files Tests
    describe('Files API', () => {
        it('should upload a new file', async () => {
            const formData = new FormData();
            const blob = new Blob(['test file content'], { type: 'text/plain' });
            formData.append('file', blob, 'test.txt');
            formData.append('description', 'Test file description');

            const response = await axios.post(`${API_URL}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            expect(response.status).to.equal(201);
            expect(response.data).to.have.property('_id');
            fileId = response.data._id;
        });

        it('should get all files', async () => {
            const response = await axios.get(`${API_URL}/files`);
            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('files');
            expect(response.data.files).to.be.an('array');
        });

        it('should update file details', async () => {
            const response = await axios.put(`${API_URL}/files/${fileId}`, {
                description: 'Updated file description'
            });
            expect(response.status).to.equal(200);
            expect(response.data.description).to.equal('Updated file description');
        });

        it('should delete a file', async () => {
            const response = await axios.delete(`${API_URL}/files/${fileId}`);
            expect(response.status).to.equal(200);
        });
    });
});
