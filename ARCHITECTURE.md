# 🏗️ Architecture Documentation

## System Overview

This is a **location-based P2P repair marketplace** platform connecting customers with independent repair technicians for Chinese products lacking after-sales service in Korea.

### Platform Flow

```
Customer                    Platform                    Repairer
   |                           |                            |
   |--[1. Post Request]------->|                            |
   |   (broken e-scooter)      |                            |
   |                           |----[2. Notify]------------>|
   |                           |    (nearby requests)       |
   |                           |<---[3. Submit Quote]-------|
   |<--[4. Show Quotes]--------|    ("16만5천원")          |
   |                           |                            |
   |--[5. Choose Quote]------->|                            |
   |                           |----[6. Connect]----------->|
   |<---------[7. Chat & Arrange Repair]------------------>|
   |                           |                            |
   |<---------[8. Perform Repair]------------------------- >|
   |                           |                            |
   |--[9. Review]------------->|----[10. Update Rating]--->|
```

## Data Models

### Core Entities

#### 1. RepairRequest
```typescript
{
  id: string;
  title: string;                    // "샤오미 전동킥보드 배터리 교체"
  category: string;                 // "전동킥보드" | "드론" | "전동휠" | "전자기기"
  description: string;              // Problem details
  location: string;                 // "서울 강남구"
  district: string;                 // "강남구" (for matching)
  images: string[];                 // Product photos
  estimatedCost?: string;           // "15만원~20만원" (Korean format)
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  userId: string;
  userName: string;
}
```

#### 2. Repairer
```typescript
{
  id: string;
  name: string;                     // "정비달인"
  location: string;                 // "서울 강남구"
  district: string;                 // "강남구" (for distance calculation)
  specialties: string[];            // ["전동킥보드", "전동휠"]
  rating: number;                   // 4.8 (0-5 stars)
  reviewCount: number;              // 127
  experience: string;               // "5년"
  description: string;              // Bio
  estimatedPrices: Array<{
    category: string;               // "전동킥보드 배터리 교체"
    priceRange: string;             // "15만원~25만원"
  }>;
}
```

#### 3. Quote (Bid)
```typescript
{
  id: string;
  repairRequestId: string;          // Which request
  repairerId: string;
  repairerName: string;
  estimatedCost: string;            // "18만원" (Korean format)
  estimatedDuration: string;        // "1-2일" | "당일"
  message: string;                  // Personal message to customer
  createdAt: Date;
}
```

## Location System

### Geographic Coverage
- **17 cities/provinces** (시/도) - Seoul, Busan, Incheon, etc.
- **228 districts** (구/군) - Gangnam-gu, Seocho-gu, etc.
- Complete South Korea administrative divisions

### Distance Calculation
```typescript
// Simplified Euclidean distance (production should use Haversine)
function calculateDistance(district1: string, district2: string): number {
  const coord1 = districtCoordinates[district1];
  const coord2 = districtCoordinates[district2];
  
  const latDiff = coord1.lat - coord2.lat;
  const lngDiff = coord1.lng - coord2.lng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
  
  return Math.round(distance * 10) / 10; // 1 decimal place
}
```

### Distance Badges
| Distance | Badge | Priority |
|----------|-------|----------|
| < 2km | 🏠 초근거리 | Highest |
| 2-5km | 📍 근처 | High |
| 5-10km | 🚗 같은 도시 | Medium |
| > 10km | 📮 가능 | Low |

## Routing Architecture

### React Router Setup (Data Mode)
```typescript
// routes.ts
createBrowserRouter([
  {
    path: '/',
    Component: Root,              // Wrapper with Outlet
    children: [
      { index: true, Component: HomePage },
      { path: 'repairers', Component: RepairersPage },
      { path: 'request/:id', Component: RequestDetailPage },
      // ... all routes
    ]
  }
])
```

### Page Hierarchy
```
Root (Outlet wrapper)
├── HomePage (3-step onboarding)
│   ├── Welcome Screen
│   ├── Region Selection
│   └── Main Feed
├── RepairersPage
│   ├── Requests Tab (customers needing help)
│   └── Repairers Tab (available technicians)
├── RequestDetailPage
│   ├── Request Info
│   ├── Repairer Quotes
│   └── Chat Button
├── CreateRequestPage
│   ├── Category Selection
│   ├── Photo Upload
│   ├── Description
│   └── Region Selection
└── ... other pages
```

## Design System

### Color Palette
```css
/* Primary Gradient */
--primary-start: #4F46E5;  /* Indigo-600 */
--primary-end: #3B82F6;    /* Blue-600 */

/* Semantic Colors */
--success: #10B981;        /* Green-500 */
--warning: #F59E0B;        /* Amber-500 */
--error: #EF4444;          /* Red-500 */
--info: #3B82F6;           /* Blue-600 */

/* Neutral Palette */
--slate-50: #F8FAFC;
--slate-100: #F1F5F9;
--slate-500: #64748B;
--slate-800: #1E293B;
--slate-900: #0F172A;
```

### Component Patterns

#### Squircle Cards
```tsx
<div className="rounded-3xl bg-white border border-slate-100 
                shadow-[0_2px_10px_rgba(0,0,0,0.02)]
                hover:shadow-md hover:border-indigo-100
                active:scale-[0.98] transition-all">
  {/* Content */}
</div>
```

#### Glassmorphism Headers
```tsx
<header className="sticky top-0 z-50
                   bg-white/80 backdrop-blur-xl
                   border-b border-slate-100
                   shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
  {/* Header content */}
</header>
```

#### Gradient Buttons
```tsx
<button className="bg-gradient-to-r from-indigo-600 to-blue-600
                   text-white font-bold
                   shadow-[0_8px_30px_rgba(79,70,229,0.2)]
                   hover:shadow-[0_10px_40px_rgba(79,70,229,0.3)]
                   active:scale-[0.98] transition-all">
  시작하기
</button>
```

### Typography Scale
```css
/* Display (Hero) */
.text-hero { font-size: 3rem; font-weight: 900; }

/* Headings */
.text-2xl { font-size: 1.5rem; font-weight: 800; }
.text-xl { font-size: 1.25rem; font-weight: 800; }
.text-lg { font-size: 1.125rem; font-weight: 700; }

/* Body */
.text-base { font-size: 1rem; font-weight: 600; }
.text-sm { font-size: 0.875rem; font-weight: 500; }
.text-xs { font-size: 0.75rem; font-weight: 500; }

/* Emphasis */
.font-extrabold { font-weight: 800; }
.font-black { font-weight: 900; }
```

## State Management

### Current Approach (Component State)
```typescript
// Simple useState for demo/prototype
const [selectedDistrict, setSelectedDistrict] = useState('강남구');
const [repairRequests, setRepairRequests] = useState(mockRequests);
```

### Production Recommendations
```typescript
// Option 1: React Context for global state
const UserContext = createContext();
const RepairContext = createContext();

// Option 2: Redux Toolkit
const store = configureStore({
  reducer: {
    user: userReducer,
    repairs: repairsReducer,
    chat: chatReducer
  }
});

// Option 3: Zustand (lightweight)
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

## API Integration (Future)

### Recommended Backend Architecture
```
Frontend (React)
    ↓
API Gateway (Express/Fastify)
    ↓
Services Layer
    ├── Auth Service
    ├── Repair Request Service
    ├── Repairer Service
    ├── Quote Service
    ├── Chat Service
    └── Notification Service
    ↓
Database (PostgreSQL)
    ├── users
    ├── repair_requests
    ├── repairers
    ├── quotes
    ├── messages
    └── reviews
```

### Sample API Endpoints
```typescript
// Repair Requests
GET    /api/requests?district=강남구&category=전동킥보드
POST   /api/requests
GET    /api/requests/:id
PATCH  /api/requests/:id/status

// Quotes
GET    /api/requests/:id/quotes
POST   /api/quotes
PATCH  /api/quotes/:id/accept

// Repairers
GET    /api/repairers?district=강남구&specialty=전동킥보드
GET    /api/repairers/:id
POST   /api/repairers (registration)

// Chat
GET    /api/chats
GET    /api/chats/:id/messages
POST   /api/chats/:id/messages
WS     /api/chat (real-time)

// Geolocation
POST   /api/geocode (address → lat/lng)
POST   /api/distance (calculate between two points)
```

## Performance Optimization

### Current Optimizations
- Code splitting by route (React Router)
- Lazy loading for images
- Memoized components where needed
- CSS-in-JS avoided (using Tailwind)

### Production Recommendations
```typescript
// 1. Route-based code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const RepairersPage = lazy(() => import('./pages/RepairersPage'));

// 2. Image optimization
<ImageWithFallback 
  src={imageUrl} 
  loading="lazy"
  width={400}
  height={300}
/>

// 3. Virtual scrolling for long lists
import { VirtualList } from 'react-window';

// 4. Debounced search
const debouncedSearch = useMemo(
  () => debounce((query) => performSearch(query), 300),
  []
);

// 5. Service Worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## Security Considerations

### Authentication (Future Implementation)
```typescript
// JWT token storage
localStorage.setItem('auth_token', token);

// Axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Protected routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};
```

### Data Validation
```typescript
// Zod schema validation
const repairRequestSchema = z.object({
  title: z.string().min(5).max(100),
  category: z.enum(['전동킥보드', '드론', '전동휠', '전자기기']),
  description: z.string().min(20).max(1000),
  estimatedCost: z.string().regex(/^[\d,]+원$/),
  images: z.array(z.string().url()).max(5),
});
```

### Input Sanitization
```typescript
// DOMPurify for user-generated content
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput);
```

## Testing Strategy

### Unit Tests (Vitest)
```typescript
describe('calculateDistance', () => {
  it('should calculate distance between two districts', () => {
    const distance = calculateDistance('강남구', '서초구');
    expect(distance).toBeCloseTo(4.7, 1);
  });
  
  it('should return 999 for unknown districts', () => {
    const distance = calculateDistance('Unknown', '강남구');
    expect(distance).toBe(999);
  });
});
```

### Integration Tests (React Testing Library)
```typescript
describe('HomePage', () => {
  it('should navigate from welcome to region selection', () => {
    render(<HomePage />);
    
    const startButton = screen.getByText('시작하기');
    fireEvent.click(startButton);
    
    expect(screen.getByText('어느 동네에서 찾으시나요?')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)
```typescript
test('customer can post repair request', async ({ page }) => {
  await page.goto('/');
  await page.click('text=시작하기');
  await page.click('text=서울');
  await page.click('text=강남구');
  await page.click('text=글쓰기');
  
  await page.fill('input[name="title"]', '전동킥보드 수리 필요');
  await page.click('text=전동킥보드');
  await page.fill('textarea[name="description"]', '배터리가 금방 닳아요');
  await page.click('text=등록하기');
  
  await expect(page).toHaveURL(/\/request\/\d+/);
});
```

## Deployment

### Build Configuration
```bash
# Production build
npm run build

# Output: /dist
# - Minified JS/CSS
# - Optimized images
# - Source maps (optional)
```

### Hosting Recommendations
1. **Vercel** - Zero config, auto deployments
2. **Netlify** - Similar to Vercel
3. **AWS S3 + CloudFront** - Enterprise scale
4. **Firebase Hosting** - Google ecosystem

### Environment Variables
```env
# .env.production
VITE_API_URL=https://api.repairmarket.kr
VITE_KAKAO_MAP_KEY=your_key_here
VITE_TOSS_CLIENT_KEY=your_key_here
VITE_FIREBASE_CONFIG=your_config_here
```

## Monitoring & Analytics

### Recommended Tools
```typescript
// 1. Error tracking (Sentry)
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// 2. Analytics (Google Analytics 4)
gtag('event', 'repair_request_created', {
  category: '전동킥보드',
  district: '강남구',
});

// 3. Performance monitoring
import { initPerformanceMonitoring } from './utils/performance';
initPerformanceMonitoring();

// 4. User behavior (Mixpanel)
mixpanel.track('Quote Submitted', {
  repairerId: 'r1',
  estimatedCost: '18만원',
  responseTime: '2시간',
});
```

## Accessibility

### WCAG 2.1 Compliance
- ✅ Semantic HTML elements
- ✅ ARIA labels for icons
- ✅ Keyboard navigation support
- ✅ Color contrast ratios (4.5:1 minimum)
- ✅ Focus indicators
- ✅ Alt text for images

### Screen Reader Support
```tsx
<button 
  aria-label="견적 제출하기"
  className="p-2 rounded-full">
  <Send className="w-5 h-5" />
  <span className="sr-only">견적 제출</span>
</button>
```

## Internationalization (Future)

### i18n Setup (react-i18next)
```typescript
// Currently Korean-only
// Future: Support English, Chinese, Vietnamese

const resources = {
  ko: {
    translation: {
      "repair_request": "수리 요청",
      "find_repairer": "수리 기사 찾기",
    }
  },
  en: {
    translation: {
      "repair_request": "Repair Request",
      "find_repairer": "Find Repairer",
    }
  }
};
```

---

**Last Updated:** 2026-02-20  
**Version:** 0.0.1  
**Status:** Prototype/Demo
