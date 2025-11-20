import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TourListing from '../../src/components/TourListing';
import { Tour } from '../../shared/types/tour';

// Mock data for testing
const mockTours: Tour[] = [
  {
    tour_id: '1',
    name: 'Historic Walking Tour',
    short_description: 'Explore the historic city center on foot',
    description: 'A comprehensive walking tour through the historic downtown area',
    destination: 'Boston',
    category: 'cultural',
    type: 'outbound_package',
    base_price: 65.00,
    currency: 'USD',
    duration_hours: 2.5,
    min_participants: 2,
    max_participants: 15,
    status: 'active',
    images: [
      {
        image_id: 'img1',
        url: 'https://example.com/image1.jpg',
        alt_text: 'Historic building',
        is_primary: true,
        display_order: 1
      }
    ],
    rating: 4.5,
    review_count: 23,
    languages: ['en', 'fr'],
    inclusions: ['Professional guide', 'Walking tour'],
    exclusions: ['Meals'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    tour_id: '2',
    name: 'Boston Museum Tour',
    short_description: 'Art and history museum experience',
    description: 'Guided tour of Boston\'s finest museums',
    destination: 'Boston',
    category: 'museum',
    type: 'inbound_service',
    base_price: 45.00,
    currency: 'USD',
    duration_hours: 3,
    min_participants: 1,
    max_participants: 20,
    status: 'active',
    images: [
      {
        image_id: 'img2',
        url: 'https://example.com/image2.jpg',
        alt_text: 'Museum interior',
        is_primary: true,
        display_order: 1
      }
    ],
    rating: 4.2,
    review_count: 15,
    languages: ['en'],
    inclusions: ['Entrance fees', 'Guide'],
    exclusions: ['Transportation'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

const mockEmptyTours: Tour[] = [];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 50,
  totalPages: 3
};

const mockFilters = {
  destinations: ['Boston', 'New York', 'Washington DC'],
  categories: ['cultural', 'museum', 'adventure'],
  price_range: { min: 25, max: 200 }
};

describe('TourListing Component', () => {
  const defaultProps = {
    tours: mockTours,
    pagination: mockPagination,
    filters: mockFilters,
    loading: false,
    error: null,
    onFilterChange: jest.fn(),
    onPageChange: jest.fn(),
    onTourSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render tour listing with tour data', () => {
      render(<TourListing {...defaultProps} />);

      expect(screen.getByText('Historic Walking Tour')).toBeInTheDocument();
      expect(screen.getByText('Boston Museum Tour')).toBeInTheDocument();
      expect(screen.getByText('Explore the historic city center on foot')).toBeInTheDocument();
      expect(screen.getByText('$65.00')).toBeInTheDocument();
      expect(screen.getByText('$45.00')).toBeInTheDocument();
    });

    it('should display tour images correctly', () => {
      render(<TourListing {...defaultProps} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Historic building');
    });

    it('should display tour ratings and reviews', () => {
      render(<TourListing {...defaultProps} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('(23 reviews)')).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('(15 reviews)')).toBeInTheDocument();
    });

    it('should display tour information correctly', () => {
      render(<TourListing {...defaultProps} />);

      expect(screen.getByText('Boston')).toBeInTheDocument();
      expect(screen.getByText('cultural')).toBeInTheDocument();
      expect(screen.getByText('2.5 hours')).toBeInTheDocument();
      expect(screen.getByText('3 hours')).toBeInTheDocument();
      expect(screen.getByText('2-15 participants')).toBeInTheDocument();
      expect(screen.getByText('1-20 participants')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should display loading state correctly', () => {
      render(<TourListing {...defaultProps} loading={true} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.queryByText('Historic Walking Tour')).not.toBeInTheDocument();
    });

    it('should display skeleton loaders while loading', () => {
      render(<TourListing {...defaultProps} loading={true} />);

      const skeletons = screen.getAllByTestId('skeleton-loader');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not render tours when loading', () => {
      render(<TourListing {...defaultProps} loading={true} />);

      expect(screen.queryByText('Historic Walking Tour')).not.toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should display error message when error occurs', () => {
      const error = new Error('Failed to load tours');
      render(<TourListing {...defaultProps} error={error.message} />);

      expect(screen.getByText('Failed to load tours')).toBeInTheDocument();
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });

    it('should allow retry on error', async () => {
      const error = new Error('Failed to load tours');
      const onRetry = jest.fn();
      
      render(
        <TourListing 
          {...defaultProps} 
          error={error.message} 
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByText(/retry/i);
      await userEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render tours when error occurs', () => {
      const error = new Error('Failed to load tours');
      render(<TourListing {...defaultProps} error={error.message} />);

      expect(screen.queryByText('Historic Walking Tour')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no tours found', () => {
      render(<TourListing {...defaultProps} tours={mockEmptyTours} />);

      expect(screen.getByText(/no tours found/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your search criteria/i)).toBeInTheDocument();
    });

    it('should provide clear call-to-action in empty state', () => {
      render(<TourListing {...defaultProps} tours={mockEmptyTours} />);

      expect(screen.getByText(/browse all tours/i)).toBeInTheDocument();
      expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('should render filter dropdowns', () => {
      render(<TourListing {...defaultProps} />);

      expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/price range/i)).toBeInTheDocument();
    });

    it('should call onFilterChange when filter changes', async () => {
      render(<TourListing {...defaultProps} />);

      const destinationFilter = screen.getByLabelText(/destination/i);
      await userEvent.selectOptions(destinationFilter, 'Boston');

      expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'Boston'
        })
      );
    });

    it('should display current filter selections', () => {
      const currentFilters = {
        destination: 'Boston',
        category: 'cultural',
        priceRange: [50, 100]
      };

      render(
        <TourListing 
          {...defaultProps} 
          currentFilters={currentFilters}
        />
      );

      expect(screen.getByText('Boston')).toBeInTheDocument();
      expect(screen.getByText('cultural')).toBeInTheDocument();
    });
  });

  describe('Tour Selection', () => {
    it('should call onTourSelect when tour card is clicked', async () => {
      render(<TourListing {...defaultProps} />);

      const tourCard = screen.getByText('Historic Walking Tour').closest('[role="button"]');
      await userEvent.click(tourCard!);

      expect(defaultProps.onTourSelect).toHaveBeenCalledWith(mockTours[0]);
    });

    it('should allow keyboard navigation to tour cards', () => {
      render(<TourListing {...defaultProps} />);

      const tourCard = screen.getByText('Historic Walking Tour').closest('[role="button"]');
      expect(tourCard).toHaveAttribute('tabIndex', '0');
    });

    it('should show tour detail preview on hover', async () => {
      render(<TourListing {...defaultProps} />);

      const tourCard = screen.getByText('Historic Walking Tour');
      fireEvent.mouseEnter(tourCard);

      await waitFor(() => {
        expect(screen.getByText('Comprehensive walking tour')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls', () => {
      render(<TourListing {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });

    it('should call onPageChange when page is clicked', async () => {
      render(<TourListing {...defaultProps} />);

      const page2Button = screen.getByText('2');
      await userEvent.click(page2Button);

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });

    it('should show current page as active', () => {
      render(<TourListing {...defaultProps} pagination={{ ...mockPagination, page: 2 }} />);

      const activePage = screen.getByText('2').closest('button');
      expect(activePage).toHaveClass('active');
    });

    it('should disable Previous button on first page', () => {
      render(<TourListing {...defaultProps} />);

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      render(<TourListing {...defaultProps} pagination={{ ...mockPagination, page: 3 }} />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<TourListing {...defaultProps} />);

      expect(screen.getByPlaceholderText(/search tours/i)).toBeInTheDocument();
    });

    it('should update search and call onFilterChange', async () => {
      render(<TourListing {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search tours/i);
      await userEvent.type(searchInput, 'walking');

      expect(searchInput).toHaveValue('walking');
      
      // Debounce might delay the filter call
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'walking'
          })
        );
      });
    });

    it('should clear search and call onFilterChange', async () => {
      render(<TourListing {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search tours/i);
      await userEvent.type(searchInput, 'walking');
      
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await userEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          search: ''
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TourListing {...defaultProps} />);

      expect(screen.getByRole('region', { name: /tour results/i })).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<TourListing {...defaultProps} />);

      const tourCards = screen.getAllByRole('button', { name: /historic walking tour/i });
      expect(tourCards[0]).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper heading structure', () => {
      render(<TourListing {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should have alt text for images', () => {
      render(<TourListing {...defaultProps} />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<TourListing {...defaultProps} />);

      expect(screen.getByTestId('tour-listing')).toHaveClass('mobile-layout');
    });

    it('should toggle filters panel on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<TourListing {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /show filters/i });
      await userEvent.click(toggleButton);

      expect(screen.getByTestId('filters-panel')).toBeVisible();
    });
  });

  describe('Performance', () => {
    it('should render large tour list efficiently', () => {
      const largeTourList = Array(100).fill(null).map((_, index) => ({
        ...mockTours[0],
        tour_id: `tour-${index}`,
        name: `Tour ${index}`
      }));

      const startTime = performance.now();
      render(<TourListing {...defaultProps} tours={largeTourList} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render in under 1 second
      expect(screen.getAllByRole('listitem')).toHaveLength(100);
    });

    it('should virtualize long lists for better performance', () => {
      const largeTourList = Array(1000).fill(null).map((_, index) => ({
        ...mockTours[0],
        tour_id: `tour-${index}`,
        name: `Tour ${index}`
      }));

      render(<TourListing {...defaultProps} tours={largeTourList} />);

      // Should only render visible items for virtual scrolling
      expect(screen.getAllByRole('listitem').length).toBeLessThan(100);
    });
  });

  describe('Interactions', () => {
    it('should handle tour card hover effects', async () => {
      render(<TourListing {...defaultProps} />);

      const tourCard = screen.getByText('Historic Walking Tour').closest('[role="button"]');
      fireEvent.mouseEnter(tourCard!);

      await waitFor(() => {
        expect(tourCard!).toHaveClass('hover');
      });
    });

    it('should handle tour card focus effects', async () => {
      render(<TourListing {...defaultProps} />);

      const tourCard = screen.getByText('Historic Walking Tour').closest('[role="button"]');
      fireEvent.focus(tourCard!);

      expect(tourCard!).toHaveClass('focus');
    });

    it('should handle bookmark/favorite functionality', async () => {
      const onBookmark = jest.fn();
      render(<TourListing {...defaultProps} onBookmark={onBookmark} />);

      const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
      await userEvent.click(bookmarkButton);

      expect(onBookmark).toHaveBeenCalledWith(mockTours[0].tour_id);
    });
  });
});
