# 🔧 Chinese Product Repair Marketplace

A peer-to-peer repair service platform inspired by Karrot Market (당근마켓), connecting customers with local independent repair technicians for Chinese products without after-sales service.

## 🎯 Problem & Solution

**Problem:** Chinese products (e-scooters, drones, electronics) lack proper after-sales service in Korea.

**Solution:** Location-based marketplace where customers post repair requests and local technicians bid with quotes.

## ✨ Core Features

### 🗺️ Location-Based Matching
- **17 cities × 228 districts** - Complete South Korea coverage
- **Distance calculation** - Shows distance between customer and repairer
- **Ultra-close badge** - Special indicator for repairers within 2km
- **Regional filtering** - Find repairers in your neighborhood

### 💰 Bidding System
1. **Customer posts** repair request ("수리해주세요")
2. **Repairers bid** with price quotes ("수리할 수 있어요")
3. **Customer chooses** best quote ("딜")
4. **Deal made** and repair scheduled

### 💵 Korean Price Format
All amounts displayed in natural Korean format:
- "15만원" (150,000 KRW)
- "16만5천원" (165,000 KRW)
- "2만원~10만원" (20,000-100,000 KRW range)

### 📱 Mobile-First Design
- Bottom tab navigation (iOS-style)
- Glassmorphism headers with backdrop blur
- Bouncy touch animations (`active:scale-[0.98]`)
- Emoji-first, minimal text approach
- Warm community feel

## 🎨 Design System

### Color Theme
- **Primary:** Indigo/Blue gradient (`from-indigo-600 to-blue-600`)
- **Purpose:** Trustworthy, professional, premium feel
- **Changed from:** Original orange Karrot Market style

### UI Components
- **Cards:** Squircle design (`rounded-3xl`)
- **Headers:** Glassmorphism (`backdrop-blur-xl`, `bg-white/80`)
- **Buttons:** Gradient fills with shadow glow
- **Animations:** Smooth transitions with scale effects
- **Icons:** Lucide React + emoji combinations

### Typography
- **Headings:** `font-extrabold`, `font-black`
- **Body:** `font-bold`, `font-medium`
- **Emphasis:** Gradient text clips for highlights

## 🏗️ Project Structure

```
src/app/
├── App.tsx                 # Main entry point with RouterProvider
├── routes.ts              # React Router configuration
├── types.ts               # TypeScript interfaces
│
├── pages/                 # All page components
│   ├── HomePage.tsx       # 3-step: welcome → region → feed
│   ├── LandingPage.tsx    # Full catalog view
│   ├── RepairersPage.tsx  # Browse repairers
│   ├── CreateRequestPage.tsx  # Post repair request
│   ├── RequestDetailPage.tsx  # Request detail + quotes
│   ├── RepairerProfilePage.tsx # Repairer profile
│   ├── ChatsPage.tsx      # Message inbox
│   ├── MyPage.tsx         # User profile
│   └── ...
│
├── components/            # Reusable components
│   ├── RegionSelector.tsx
│   ├── RepairRequestCard.tsx
│   └── ...
│
├── data/
│   ├── mockData.ts        # Sample repair requests, repairers, quotes
│   └── regions.ts         # 17 cities × 228 districts data
│
└── utils/
    └── distance.ts        # Distance calculation utilities
```

## 📦 Tech Stack

- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6 (Data mode with `createBrowserRouter`)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Date Formatting:** date-fns with Korean locale
- **Build Tool:** Vite

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view in browser.

### Build

```bash
npm run build
```

## 📱 Key Pages

### Home Page (`/`)
Three-step onboarding:
1. **Welcome screen** - Premium glassmorphism intro
2. **Region selection** - Choose city and district
3. **Main feed** - Real-time repair requests

### Repairers Page (`/repairers`)
- Browse repair technicians
- Filter by specialty and location
- View ratings and reviews
- See distance from your location

### Request Detail (`/request/:id`)
- View repair request details
- See all repairer quotes/bids
- Compare prices and timelines
- Chat with repairers

### Create Request (`/create-request`)
- Upload product photos
- Select category (e-scooter, drone, etc.)
- Describe problem
- Set expected price range

## 🌍 Location System

### Coverage
- **17 major cities/provinces** (시/도)
- **228 districts** (구/군)
- Complete South Korea administrative divisions

### Distance Badges
- **<2km:** Special ultra-close indicator
- **2-5km:** Near neighborhood
- **5-10km:** Same city
- **>10km:** Available but further

### Sample Districts (Seoul)
강남구, 강동구, 강북구, 강서구, 관악구, 광진구, 구로구, 금천구, 노원구, 도봉구, 동대문구, 동작구, 마포구, 서대문구, 서초구, 성동구, 성북구, 송파구, 양천구, 영등포구, 용산구, 은평구, 종로구, 중구, 중랑구

## 💡 User Flow Examples

### As a Customer
1. Post repair request for broken e-scooter
2. Receive quotes from nearby repairers
3. Compare prices: "15만원", "16만5천원", "18만원"
4. Choose best repairer based on price, distance, rating
5. Chat to arrange repair
6. Leave review after completion

### As a Repairer
1. Browse repair requests in your area
2. Filter by specialty (e-scooters, drones, etc.)
3. Submit competitive quote
4. Wait for customer to choose
5. Arrange meeting and perform repair
6. Build reputation through reviews

## 🎯 Business Model

### For Customers
- Free to post repair requests
- No commission on deals (currently)
- Direct P2P payment to repairers

### For Repairers
- Free to browse and quote
- Build reputation through reviews
- Set own prices and availability
- Future: Premium features (boosted listings, etc.)

## 🔮 Future Enhancements

### Technical
- [ ] Real geolocation with Kakao/Naver Maps API
- [ ] Haversine formula for accurate distance
- [ ] Push notifications for new quotes
- [ ] Real-time chat with WebSocket
- [ ] Payment integration (Toss, KakaoPay)

### Features
- [ ] Repairer verification system
- [ ] Insurance/warranty options
- [ ] Before/after photo gallery
- [ ] Service history tracking
- [ ] Referral rewards program

### Design
- [ ] Dark mode support
- [ ] Animated onboarding tutorial
- [ ] Repairer badge system
- [ ] Achievement unlocks
- [ ] Interactive map view

## 📝 Notes for AI Developers

This codebase is extensively commented in **English** to help future AI models understand and modify the project easily.

### Key Conventions
- All prices in Korean format (no symbols, natural language)
- Distance in km/m, not miles
- Mobile-first responsive design
- Indigo/blue brand colors throughout
- Active touch animations on all interactive elements

### Where to Start
1. Read `/src/app/App.tsx` for platform overview
2. Check `/src/app/types.ts` for data structures
3. Review `/src/app/data/mockData.ts` for sample data
4. Explore `/src/app/pages/HomePage.tsx` for UI patterns

## 📄 License

MIT License - Free to use and modify

## 🙏 Credits

- Inspired by Karrot Market (당근마켓)
- Icons by Lucide React
- UI influenced by modern Korean mobile apps
- Built with ❤️ for the Korean repair community

---

**Note:** This is a demonstration project with mock data. Production deployment would require:
- Real backend API
- Database (PostgreSQL/MongoDB)
- Authentication system
- Payment gateway integration
- Map service integration (Kakao/Naver Maps)
- File storage (AWS S3/CloudFlare R2)
