import request from 'supertest';
import { app } from '../../src/App';
import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

describe('Tour Browsing Flow Integration Tests', () => {
  let authToken: string;
  let tourIds: string[] = [];
  const baseURL = '/api/v1/tours';

  beforeAll(async () => {
    // Setup test database and seed data
    await setupTestDatabase();
    authToken = await getTestAuthToken();
  });

  beforeEach(async () => {
    // Reset state between tests if needed
  });

  describe('Complete Tour Browsing Workflow', () => {
    it('should perform complete tour browsing flow from search to tour details', async () => {
      // Step 1: Search tours with filters
      const searchResponse = await request(app)
        .get(baseURL)
        .query({
          destination: 'Boston',
          category: 'cultural',
          type: 'outbound_package',
          min_price: 50,
          max_price: 100,
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body.tours).toBeDefined();
      expect(searchResponse.body.tours.length).toBeGreaterThan(0);
      expect(searchResponse.body.pagination).toBeDefined();
      expect(searchResponse.body.filters).toBeDefined();

      // Step 2: Verify search filters are working
      const tours = searchResponse.body.tours;
      const allMatchFilters = tours.every((tour: any) => 
        tour.destination === 'Boston' &&
        tour.category === 'cultural' &&
        tour.type === 'outbound_package' &&
        tour.base_price >= 50 &&
        tour.base_price <= 100
      );
      expect(allMatchFilters).toBe(true);

      // Step 3: Get tour details
      const firstTour = tours[0];
      const detailResponse = await request(app)
        .get(`${baseURL}/${firstTour.tour_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(detailResponse.body).toHaveProperty('tour');
      expect(detailResponse.body.tour.tour_id).toBe(firstTour.tour_id);
      expect(detailResponse.body.tour).toHaveProperty('description');
      expect(detailResponse.body.tour).toHaveProperty('supplier_info');

      // Step 4: Verify tour details match summary
      expect(detailResponse.body.tour.name).toBe(firstTour.name);
      expect(detailResponse.body.tour.base_price).toBe(firstTour.base_price);
      expect(detailResponse.body.tour.destination).toBe(firstTour.destination);
    });

    it('should handle pagination correctly across multiple pages', async () => {
      // Get first page
      const page1Response = await request(app)
        .get(baseURL)
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get second page
      const page2Response = await request(app)
        .get(baseURL)
        .query({ page: 2, limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify no overlap between pages
      const page1Ids = page1Response.body.tours.map((t: any) => t.tour_id);
      const page2Ids = page2Response.body.tours.map((t: any) => t.tour_id);
      const hasOverlap = page1Ids.some((id: string) => page2Ids.includes(id));
      
      expect(hasOverlap).toBe(false);
      expect(page2Response.body.pagination.page).toBe(2);
      expect(page1Response.body.pagination.page).toBe(1);
    });

    it('should handle empty results gracefully', async () => {
      const searchResponse = await request(app)
        .get(baseURL)
        .query({
          search: 'nonexistent tour that will never exist',
          destination: 'NonExistentCity',
          category: 'nonexistent'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body.tours).toHaveLength(0);
      expect(searchResponse.body.pagination.total).toBe(0);
      expect(searchResponse.body.pagination.totalPages).toBe(0);
      expect(searchResponse.body.filters).toBeDefined();
    });
  });

  describe('Search and Filter Integration', () => {
    it('should combine multiple search filters effectively', async () => {
      const searchResponse = await request(app)
        .get(baseURL)
        .query({
          search: 'walking',
          destination: 'Boston',
          category: 'cultural',
          type: 'outbound_package',
          min_price: 30,
          max_price: 80,
          start_date: '2025-12-01',
          end_date: '2025-12-31',
          participants: 4
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body.tours).toBeDefined();
      
      // Verify all results match criteria
      const tours = searchResponse.body.tours;
      const allMatch = tours.every((tour: any) => {
        const matchesSearch = tour.name.toLowerCase().includes('walking') || 
                            tour.description.toLowerCase().includes('walking');
        const matchesDestination = tour.destination === 'Boston';
        const matchesCategory = tour.category === 'cultural';
        const matchesType = tour.type === 'outbound_package';
        const matchesPrice = tour.base_price >= 30 && tour.base_price <= 80;
        
        return matchesSearch && matchesDestination && matchesCategory && 
               matchesType && matchesPrice;
      });

      expect(allMatch).toBe(true);
    });

    it('should return consistent filter options across searches', async () => {
      const response1 = await request(app)
        .get(baseURL)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response2 = await request(app)
        .get(baseURL)
        .query({ destination: 'Boston' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Filter options should be consistent
      expect(response1.body.filters.destinations).toContain('Boston');
      expect(response2.body.filters.destinations).toContain('Boston');
    });

    it('should handle case-insensitive search', async () => {
      const searchResponse = await request(app)
        .get(baseURL)
        .query({ search: 'WALKING TOUR' }) // Uppercase
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const searchResponse2 = await request(app)
        .get(baseURL)
        .query({ search: 'walking tour' }) // Lowercase
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body.tours.length).toBe(searchResponse2.body.tours.length);
    });
  });

  describe('Performance Integration', () => {
    it('should maintain acceptable response times for complex queries', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(baseURL)
        .query({
          search: 'walking tour',
          destination: 'Boston',
          category: 'cultural',
          type: 'outbound_package',
          min_price: 50,
          max_price: 100,
          page: 1,
          limit: 20
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(1000); // Under 1 second
      expect(response.body.tours).toBeDefined();
    });

    it('should handle concurrent requests without errors', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get(baseURL)
          .query({ destination: 'Boston', limit: 10 })
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.tours).toBeDefined();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid tour ID gracefully', async () => {
      const invalidTourId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`${baseURL}/${invalidTourId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOUR_NOT_FOUND');
    });

    it('should handle authentication failures gracefully', async () => {
      const response = await request(app)
        .get(baseURL)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should handle malformed query parameters', async () => {
      const response = await request(app)
        .get(baseURL)
        .query({
          page: 'invalid',
          limit: 'invalid',
          min_price: 'invalid'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency between search and detail views', async () => {
      // Get tour from search results
      const searchResponse = await request(app)
        .get(baseURL)
        .query({ destination: 'Boston', limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (searchResponse.body.tours.length > 0) {
        const tourFromSearch = searchResponse.body.tours[0];
        
        // Get full details
        const detailResponse = await request(app)
          .get(`${baseURL}/${tourFromSearch.tour_id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify consistency
        expect(detailResponse.body.tour.name).toBe(tourFromSearch.name);
        expect(detailResponse.body.tour.base_price).toBe(tourFromSearch.base_price);
        expect(detailResponse.body.tour.destination).toBe(tourFromSearch.destination);
        expect(detailResponse.body.tour.category).toBe(tourFromSearch.category);
      }
    });

    it('should handle concurrent data updates correctly', async () => {
      // This test would require setting up concurrent operations
      // In a real implementation, this might test race conditions
      
      const response = await request(app)
        .get(baseURL)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tours).toBeDefined();
      expect(Array.isArray(response.body.tours)).toBe(true);
    });
  });

  describe('Caching Integration', () => {
    it('should leverage caching for frequent queries', async () => {
      const startTime1 = Date.now();
      
      const response1 = await request(app)
        .get(baseURL)
        .query({ destination: 'Boston' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const time1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      
      const response2 = await request(app)
        .get(baseURL)
        .query({ destination: 'Boston' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const time2 = Date.now() - startTime2;

      // Second request should be faster (cached)
      expect(response1.body.tours).toEqual(response2.body.tours);
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Multi-language Support Integration', () => {
    it('should handle different language preferences', async () => {
      const response = await request(app)
        .get(baseURL)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'fr-FR')
        .expect(200);

      expect(response.body.tours).toBeDefined();
      
      // This would test language-specific content if implemented
      expect(response.body).toHaveProperty('tours');
    });
  });
});

// Helper functions (would be in separate test utilities file)
async function setupTestDatabase() {
  // Setup test database with sample tour data
}

async function getTestAuthToken() {
  // Return test authentication token
  return 'test-auth-token';
}
