/**
 * TypeScript Type Definitions for 댕댕마켓
 * 
 * Core data models for the dog social community platform
 * Flow: Owner creates Meetup → DogSitters submit JoinRequests → Match made
 */

/**
 * Meetup (모임)
 * Owner posts a meetup request for walks, training, play, etc.
 * Status flow: pending → in-progress → completed
 */
export interface Meetup {
  id: string;
  title: string;                    // Short description of meetup
  category: string;                 // Meetup type (산책, 훈련, 놀이, 카페, etc.)
  description: string;              // Detailed meetup description
  location: string;                 // Full location (e.g., "서울 강남구")
  district: string;                 // District only (e.g., "강남구")
  images: string[];                 // Dog/meetup photos
  estimatedCost?: string;           // Schedule or cost info
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  userId: string;
  userName: string;
}

/**
 * DogSitter (댕집사) Profile
 * Community members who organize or join meetups
 * Location-based matching is key - shows distance from user
 */
export interface DogSitter {
  id: string;
  name: string;
  profileImage: string;
  location: string;                 // Full location
  district: string;                 // District for matching
  specialties: string[];            // Types of activities they do
  rating: number;                   // Average rating (0-5 stars)
  reviewCount: number;              // Number of completed meetups
  experience: string;               // Years of experience
  description: string;              // Bio and skills
  estimatedPrices: {
    category: string;               // Activity type
    priceRange: string;             // Availability or cost info
  }[];
}

/**
 * JoinRequest (참여 신청)
 * Members submit join requests to meetups
 * Multiple members can request to join one meetup
 */
export interface JoinRequest {
  id: string;
  meetupId: string;                 // Which meetup this request is for
  dogSitterId: string;
  dogSitterName: string;
  estimatedCost: string;            // Participation message or cost
  estimatedDuration: string;        // Availability
  message: string;                  // Personal message to meetup host
  createdAt: Date;
}

// Backward compatibility aliases
export type RepairRequest = Meetup;
export type Repairer = DogSitter;
export type Quote = JoinRequest;
