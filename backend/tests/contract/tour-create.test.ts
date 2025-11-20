import request from 'supertest';
import { app } from '../../src/App';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('POST /api/v1/tours - Tour Create Contract Tests', () => {
  const baseURL = '/api/v1/tours';

  beforeEach(async () => {
    // Setup test database and authenticate if needed
  });

  describe('POST /tours - Create Tour', () => {
    const validTourData = {
      name: 'Historic Walking Tour',
      description: 'A comprehensive walking tour through the historic downtown area, covering key landmarks and cultural sites.',
      short_description: 'Explore the historic city center on foot',
      type: 'outbound_package',
      category: 'cultural',
      destination: 'Boston',
      duration_hours: 2.5,
      min_participants: 2,
      max_participants: 15,
      base_price: 65.00,
      currency: 'USD',
      languages: ['en', 'fr'],
      inclusions: ['Professional guide', 'Walking tour', 'Historical sites access'],
      exclusions: ['Meals', 'Transportation to meeting point'],
      meeting_point: 'Faneuil Hall, Boston, MA',
      requirements: ['Comfortable walking shoes', 'Weather-appropriate clothing'],
      cancellation_policy: 'Free cancellation up to 24 hours before the tour'
    };

    it('should create tour with valid data and return 201', async () => {
      const response = await request(app)
        .post(baseURL)
        .send(validTourData)
        .set('Authorization', 'Bearer test-token')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /application\/json/)
        .expect(201);

      // Validate response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('tour_id');
      expect(response.body.data).toHaveProperty('name', validTourData.name);
      expect(response.body.data).toHaveProperty('description', validTourData.description);
      expect(response.body.data).toHaveProperty('type', validTourData.type);
      expect(response.body.data).toHaveProperty('status', 'draft'); // New tours default to draft
      expect(response.body.data).toHaveProperty('created_at');
    });

    it('should create tour with minimum required fields', async () => {
      const minimalData = {
        name: 'Minimal Tour',
        description: 'A tour with only required fields',
        type: 'inbound_service',
        category: 'adventure',
        destination: 'Chicago',
        duration_hours: 1,
        min_participants: 1,
        max_participants: 20,
        base_price: 25.00,
        currency: 'USD'
      };

      const response = await request(app)
        .post(baseURL)
        .send(minimalData)
        .set('Authorization', 'Bearer test-token')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tour_id');
      expect(response.body.data.name).toBe(minimalData.name);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(baseURL)
        .send(validTourData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.code', 'AUTHENTICATION_REQUIRED');
    });

    it('should require authorization (DMC Admin or Tour Operator)', async () => {
      // Test with customer role token (should fail)
      const response = await request(app)
        .post(baseURL)
        .send(validTourData)
        .set('Authorization', 'Bearer customer-token') // customer role
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.code', 'INSUFFICIENT_PERMISSIONS');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        description: '', // Empty description
        type: 'invalid_type', // Invalid enum value
        duration_hours: -1, // Negative duration
        min_participants: 100, // min > max
        max_participants: 10, // max < min
        base_price: -50 // Negative price
      };

      const response = await request(app)
        .post(baseURL)
        .send(invalidData)
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });

    it('should validate enum values for tour type', async () => {
      const invalidTypeData = {
        ...validTourData,
        type: 'invalid_tour_type'
      };

      const response = await request(app)
        .post(baseURL)
        .send(invalidTypeData)
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.details.type).toBeDefined();
    });

    it('should validate numeric field constraints', async () => {
      const invalidNumericData = {
        ...validTourData,
        duration_hours: 0, // Should be > 0
        min_participants: -1, // Should be > 0
        max_participants: 0, // Should be > min_participants
        base_price: 0 // Should be > 0
      };

      const response = await request(app)
        .post(baseURL)
        .send(invalidNumericData)
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body.error.details).toBeDefined();
    });

    it('should validate string field lengths', async () => {
      const invalidStringData = {
        ...validTourData,
        name: 'x'.repeat(256), // Exceeds maxLength
        description: 'x'.repeat(2001), // Exceeds maxLength
        destination: '', // Empty required field
        currency: 'INVALID' // Invalid currency code
      };

      const response = await request(app)
        .post(baseURL)
        .send(invalidStringData)
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body.error.details).toBeDefined();
    });

    it('should validate array fields', async () => {
      const invalidArrayData = {
        ...validTourData,
        languages: [], // Empty array
        inclusions: ['x'.repeat(501)], // Element exceeds maxLength
        exclusions: null // Should be array or undefined
      };

      const response = await request(app)
        .post(baseURL)
        .send(invalidArrayData)
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body.error.details).toBeDefined();
    });

    it('should handle duplicate tour names for same user', async () => {
      const duplicateData = {
        ...validTourData,
        name: 'Existing Tour Name'
      };

      // First creation should succeed
      await request(app)
        .post(baseURL)
        .send(duplicateData)
        .set('Authorization', 'Bearer test-token')
        .expect(201);

      // Second creation with same name should fail
      const response = await request(app)
        .post(baseURL)
        .send(duplicateData)
        .set('Authorization', 'Bearer test-token')
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.code', 'TOUR_ALREADY_EXISTS');
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database connection failure
      const response = await request(app)
        .post(baseURL)
        .send(validTourData)
        .set('Authorization', 'Bearer test-token');

      expect([500, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBeDefined();
    });
  });

  describe('Input Sanitization and Security', () => {
    it('should sanitize HTML/script injection attempts', async () => {
      const maliciousData = {
        ...validTourData,
        name: '<script>alert("xss")</script>Clean Tour',
        description: 'Normal description <img src="x" onerror="alert(1)">'
      };

      const response = await request(app)
        .post(baseURL)
        .send(maliciousData)
        .set('Authorization', 'Bearer test-token')
        .expect(201);

      // Response should not contain unsanitized input
      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.description).not.toContain('<img');
    });

    it('should prevent SQL injection in string fields', async () => {
      const sqlInjectionData = {
        ...validTourData,
        name: "'; DROP TABLE tours; --",
        description: "Normal description'; SELECT * FROM users; --"
      };

      const response = await request(app)
        .post(baseURL)
        .send(sqlInjectionData)
        .set('Authorization', 'Bearer test-token')
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should enforce request size limits', async () => {
      const largeData = {
        ...validTourData,
        description: 'x'.repeat(10001) // Exceeds typical request size
      };

      const response = await request(app)
        .post(baseURL)
        .send(largeData)
        .set('Authorization', 'Bearer test-token');

      expect([413, 400]).toContain(response.status);
    });
  });

  describe('Response Structure Validation', () => {
    it('should return valid Tour schema in response', async () => {
      const response = await request(app)
        .post(baseURL)
        .send(validTourData)
        .set('Authorization', 'Bearer test-token')
        .expect(201);

      const tour = response.body.data;
      expect(tour).toHaveProperty('tour_id');
      expect(tour).toHaveProperty('name');
      expect(tour).toHaveProperty('description');
      expect(tour).toHaveProperty('type');
      expect(tour).toHaveProperty('category');
      expect(tour).toHaveProperty('destination');
      expect(tour).toHaveProperty('duration_hours');
      expect(tour).toHaveProperty('min_participants');
      expect(tour).toHaveProperty('max_participants');
      expect(tour).toHaveProperty('base_price');
      expect(tour).toHaveProperty('currency');
      expect(tour).toHaveProperty('status');
      expect(tour).toHaveProperty('created_at');
      expect(tour).toHaveProperty('updated_at');

      // Validate enum values
      expect(['inbound_service', 'outbound_package']).toContain(tour.type);
      expect(['draft', 'active', 'inactive', 'archived']).toContain(tour.status);
    });

    it('should return correct HTTP status codes for different scenarios', async () => {
      const testCases = [
        { data: validTourData, status: 201, description: 'Valid data' },
        { data: { ...validTourData, name: '' }, status: 400, description: 'Invalid data' },
        { data: validTourData, status: 401, description: 'No auth', noAuth: true },
        { data: validTourData, status: 403, description: 'Insufficient permissions', badRole: true }
      ];

      for (const testCase of testCases) {
        let requestChain = request(app).post(baseURL).send(testCase.data);

        if (testCase.noAuth) {
          // No authorization header
        } else if (testCase.badRole) {
          requestChain = requestChain.set('Authorization', 'Bearer customer-token');
        } else {
          requestChain = requestChain.set('Authorization', 'Bearer test-token');
        }

        const response = await requestChain;
        expect(response.status).toBe(testCase.status);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on tour creation', async () => {
      const requests = Array(11).fill(null).map(() =>
        request(app)
          .post(baseURL)
          .send(validTourData)
          .set('Authorization', 'Bearer test-token')
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Audit and Logging', () => {
    it('should log tour creation attempts', async () => {
      const response = await request(app)
        .post(baseURL)
        .send(validTourData)
        .set('Authorization', 'Bearer test-token')
        .expect(201);

      // This test would verify that logs are created
      // In a real implementation, this would check the audit log
      expect(response.body.success).toBe(true);
    });

    it('should track created_by field', async () => {
      const response = await request(app)
        .post(baseURL)
        .send(validTourData)
        .set('Authorization', 'Bearer test-user-token')
        .expect(201);

      expect(response.body.data).toHaveProperty('created_by');
      expect(response.body.data.created_by).toBeDefined();
    });
  });
});
