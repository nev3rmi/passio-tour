import request from 'supertest';
import { app } from '../../src/App';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('GET /api/v1/tours - Tour Search Contract Tests', () => {
  const baseURL = '/api/v1/tours';

  beforeEach(async () => {
    // Setup test database and authenticate if needed
  });

  describe('GET /tours - Search Tours', () => {
    it('should return 200 with valid search parameters', async () => {
      const searchParams = {
        search: 'city tour',
        destination: 'Paris',
        category: 'cultural',
        type: 'outbound_package',
        page: 1,
        limit: 20
      };

      const response = await request(app)
        .get(baseURL)
        .query(searchParams)
        .set('Authorization', 'Bearer test-token')
        .expect('Content-Type', /application\/json/)
        .expect(200);

      // Validate response structure
      expect(response.body).toHaveProperty('tours');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('filters');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 20);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.filters).toHaveProperty('destinations');
      expect(response.body.filters).toHaveProperty('categories');
      expect(response.body.filters).toHaveProperty('price_range');
    });

    it('should return 200 with price range filters', async () => {
      const searchParams = {
        min_price: 50,
        max_price: 200,
        start_date: '2025-12-01',
        end_date: '2025-12-31',
        participants: 4
      };

      const response = await request(app)
        .get(baseURL)
        .query(searchParams)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.tours).toBeDefined();
      expect(Array.isArray(response.body.tours)).toBe(true);
    });

    it('should return 200 with tour type filter', async () => {
      const searchParams = {
        type: 'inbound_service'
      };

      const response = await request(app)
        .get(baseURL)
        .query(searchParams)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.tours).toBeDefined();
    });

    it('should return empty array when no tours match criteria', async () => {
      const searchParams = {
        search: 'nonexistent tour that will never exist',
        destination: 'Unknown City',
        category: 'nonexistent'
      };

      const response = await request(app)
        .get(baseURL)
        .query(searchParams)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.tours).toBeDefined();
      expect(response.body.tours).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get(baseURL)
        .query({ page: 2, limit: 10 })
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.tours).toBeDefined();
    });

    it('should validate required query parameter types', async () => {
      const invalidParams = {
        page: 'invalid_number',
        limit: 'invalid_number',
        participants: 'invalid_number'
      };

      const response = await request(app)
        .get(baseURL)
        .query(invalidParams)
        .set('Authorization', 'Bearer test-token');

      expect([400, 422]).toContain(response.status);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(baseURL)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.code', 'AUTHENTICATION_REQUIRED');
    });

    it('should handle rate limiting', async () => {
      const requests = Array(101).fill(null).map(() => 
        request(app).get(baseURL).set('Authorization', 'Bearer test-token')
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Response Structure Validation', () => {
    it('should return valid TourSummary schema for tours', async () => {
      const response = await request(app)
        .get(baseURL)
        .query({ limit: 1 })
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      if (response.body.tours.length > 0) {
        const tour = response.body.tours[0];
        expect(tour).toHaveProperty('tour_id');
        expect(tour).toHaveProperty('name');
        expect(tour).toHaveProperty('short_description');
        expect(tour).toHaveProperty('destination');
        expect(tour).toHaveProperty('category');
        expect(tour).toHaveProperty('type');
        expect(['inbound_service', 'outbound_package']).toContain(tour.type);
        expect(tour).toHaveProperty('base_price');
        expect(tour).toHaveProperty('currency');
        expect(tour).toHaveProperty('duration_hours');
        expect(tour).toHaveProperty('min_participants');
        expect(tour).toHaveProperty('max_participants');
        expect(tour).toHaveProperty('rating');
        expect(tour).toHaveProperty('review_count');
        expect(tour.images).toBeDefined();
        expect(Array.isArray(tour.images)).toBe(true);
      }
    });

    it('should return valid filters structure', async () => {
      const response = await request(app)
        .get(baseURL)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.filters).toHaveProperty('destinations');
      expect(response.body.filters).toHaveProperty('categories');
      expect(response.body.filters).toHaveProperty('price_range');
      
      if (response.body.filters.destinations) {
        expect(Array.isArray(response.body.filters.destinations)).toBe(true);
      }
      if (response.body.filters.categories) {
        expect(Array.isArray(response.body.filters.categories)).toBe(true);
      }
      if (response.body.filters.price_range) {
        expect(response.body.filters.price_range).toHaveProperty('min');
        expect(response.body.filters.price_range).toHaveProperty('max');
      }
    });

    it('should return valid pagination structure', async () => {
      const response = await request(app)
        .get(baseURL)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(typeof response.body.pagination.page).toBe('number');
      expect(typeof response.body.pagination.limit).toBe('number');
      expect(typeof response.body.pagination.total).toBe('number');
      expect(typeof response.body.pagination.totalPages).toBe('number');
    });
  });

  describe('Search Functionality', () => {
    it('should filter by search term', async () => {
      const response = await request(app)
        .get(baseURL)
        .query({ search: 'walking' })
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.tours).toBeDefined();
    });

    it('should filter by destination', async () => {
      const response = await request(app)
        .get(baseURL)
        .query({ destination: 'Paris' })
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.tours).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(baseURL)
        .query({ category: 'cultural' })
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.tours).toBeDefined();
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get(baseURL)
        .query({
          start_date: '2025-12-01',
          end_date: '2025-12-31'
        })
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.tours).toBeDefined();
    });
  });

  describe('Performance and Security', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get(baseURL)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Response should be under 1 second
    });

    it('should not expose sensitive information in response', async () => {
      const response = await request(app)
        .get(baseURL)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      // Check that sensitive fields are not present
      const tour = response.body.tours[0];
      if (tour) {
        expect(tour).not.toHaveProperty('cost_price');
        expect(tour).not.toHaveProperty('internal_notes');
        expect(tour).not.toHaveProperty('supplier_contact_details');
      }
    });
  });
});
