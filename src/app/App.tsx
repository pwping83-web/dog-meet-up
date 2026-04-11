/**
 * Main Application Entry Point
 * 
 * Chinese Product Repair Marketplace Platform
 * Inspired by Karrot Market (당근마켓) - Local P2P repair service
 * 
 * Platform Overview:
 * - Problem: Chinese products (e-scooters, drones, etc.) lack after-sales service in Korea
 * - Solution: Connect customers with local independent repair technicians
 * - Business Model: Bidding system (customers post → repairers quote → deal made)
 * 
 * Core Features:
 * - Location-based matching (17 cities × 228 districts)
 * - Distance-based sorting (special badge for <2km)
 * - Korean price format ("15만원", "16만5천원")
 * - Mobile-first design with bottom tab navigation
 * - Warm community feel with emojis and intuitive UI
 * 
 * Design System:
 * - Theme: Indigo/Blue gradient (trustworthy premium feel)
 * - Style: Squircle cards (rounded-3xl), glassmorphism headers
 * - Animations: Bouncy touch feedback (active:scale-[0.98])
 * - Focus: Emoji-first, minimal text, maximum intuition
 * 
 * Tech Stack:
 * - React + TypeScript
 * - React Router (Data mode)
 * - Tailwind CSS v4
 * - Lucide React icons
 */

import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from '../contexts/AuthContext';
import { UserLocationProvider } from '../contexts/UserLocationContext';

export default function App() {
  return (
    <AuthProvider>
      <UserLocationProvider>
        <RouterProvider router={router} />
      </UserLocationProvider>
    </AuthProvider>
  );
}