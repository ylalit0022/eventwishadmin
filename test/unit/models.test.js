const { expect } = require('chai');
const Template = require('../../models/Template');
const AdMob = require('../../models/AdMob');
const SharedFile = require('../../models/SharedFile');

describe('Model Unit Tests', () => {
    describe('Template Model', () => {
        it('should validate required fields', () => {
            const template = new Template({});
            const err = template.validateSync();
            expect(err.errors.title).to.exist;
            expect(err.errors.content).to.exist;
        });

        it('should validate template data', () => {
            const template = new Template({
                title: 'Test Template',
                content: '<p>Test content</p>',
                category: 'Test Category',
                tags: ['test', 'template'],
                isActive: true
            });

            const err = template.validateSync();
            expect(err).to.be.undefined;
        });

        it('should set default values', () => {
            const template = new Template({
                title: 'Test Template',
                content: '<p>Test content</p>'
            });

            expect(template.isActive).to.be.true;
            expect(template.tags).to.be.an('array').that.is.empty;
            expect(template.createdAt).to.be.instanceOf(Date);
        });
    });

    describe('AdMob Model', () => {
        it('should validate required fields', () => {
            const adMob = new AdMob({});
            const err = adMob.validateSync();
            expect(err.errors.adUnitName).to.exist;
            expect(err.errors.adUnitCode).to.exist;
            expect(err.errors.adType).to.exist;
        });

        it('should validate ad types', () => {
            const adMob = new AdMob({
                adUnitName: 'Test Ad',
                adUnitCode: 'test_ad_123',
                adType: 'invalid_type'
            });

            const err = adMob.validateSync();
            expect(err.errors.adType).to.exist;
        });

        it('should create valid AdMob unit', () => {
            const adMob = new AdMob({
                adUnitName: 'Test Ad',
                adUnitCode: 'test_ad_123',
                adType: 'banner',
                description: 'Test description',
                isActive: true
            });

            const err = adMob.validateSync();
            expect(err).to.be.undefined;
        });
    });

    describe('SharedFile Model', () => {
        it('should validate required fields', () => {
            const file = new SharedFile({});
            const err = file.validateSync();
            expect(err.errors.filename).to.exist;
            expect(err.errors.originalname).to.exist;
            expect(err.errors.path).to.exist;
        });

        it('should create valid file record', () => {
            const file = new SharedFile({
                filename: 'test.txt',
                originalname: 'test.txt',
                path: '/uploads/test.txt',
                mimetype: 'text/plain',
                size: 1024,
                description: 'Test file'
            });

            const err = file.validateSync();
            expect(err).to.be.undefined;
        });

        it('should set default values', () => {
            const file = new SharedFile({
                filename: 'test.txt',
                originalname: 'test.txt',
                path: '/uploads/test.txt'
            });

            expect(file.isPublic).to.be.false;
            expect(file.createdAt).to.be.instanceOf(Date);
        });
    });
});
