import { createElement } from 'react';
import { RouteErrorPage } from './pages/RouteErrorPage';

/**
 * React Router Configuration
 * 
 * Main routing setup for the 댕댕마켓 dog social community platform
 * Using React Router's Data mode (createBrowserRouter)
 * 
 * Route Structure:
 * - / : Home (simple, vibrant landing)
 * - /explore : Community explorer (meetups, MBTI, dog profiles)
 * - /sitters : 모이자·만나자 + 인증 돌봄(댕집사·인증 보호맘 통합)
 * - /create-meetup : Create new meetup
 * - /meetup/:id : Meetup detail + join requests
 * - /sitter/:id : Dog sitter profile
 * - /chats : Message inbox
 * - /my : User profile and settings
 * - /login, /signup : Authentication
 * 
 * All routes use Root component as wrapper for consistent layout
 */

import { createBrowserRouter } from 'react-router';
import { Root } from './pages/Root';
import HomePage from './pages/HomePage';
import { ExplorePage } from './pages/LandingPage';
import { DogSittersPage } from './pages/DogSittersPage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { DogSitterProfilePage } from './pages/DogSitterProfilePage';
import { MeetupDetailPage } from './pages/MeetupDetailPage';
import { MyPage } from './pages/MyPage';
import { AdminGatePage } from './pages/AdminGatePage';
import { BecomeDogSitterPage } from './pages/BecomeDogSitterPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DeleteAccountPage } from './pages/DeleteAccountPage';
import { CustomerServicePage } from './pages/CustomerServicePage';
import { ChatsPage, ChatDetailPage } from './pages/ChatsPage';
import { SearchPage } from './pages/SearchPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFound } from './pages/NotFound';
import { EmailTestPage } from './pages/EmailTestPage';
import { MyMeetupsPage } from './pages/MyMeetupsPage';
import { MyJoinRequestsPage } from './pages/MyJoinRequestsPage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { DogCreatePage } from './pages/DogCreatePage';
import { DogMbtiTestPage } from './pages/DogMbtiTestPage';
import { BillingPage } from './pages/BillingPage';
import { GuardMomsPage } from './pages/GuardMomsPage';
import { GuardMomDetailPage } from './pages/GuardMomDetailPage';
import { GuardMomRegisterPage } from './pages/GuardMomRegisterPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    errorElement: createElement(RouteErrorPage),
    children: [
      { index: true, Component: HomePage },                       // Home (simple, vibrant landing)
      { path: 'explore', Component: ExplorePage },                 // Community explorer (meetups, MBTI, profiles)
      { path: 'sitters', Component: DogSittersPage },             // Browse dog sitters & meetups
      { path: 'create-meetup', Component: CreateRequestPage },    // Create new meetup
      { path: 'sitter/:id', Component: DogSitterProfilePage },   // Dog sitter profile
      { path: 'meetup/:id', Component: MeetupDetailPage },        // Meetup detail + join requests
      { path: 'my', Component: MyPage },                          // User profile
      { path: 'profile/edit', Component: ProfileEditPage },       // Profile edit page
      { path: 'create-dog', Component: DogCreatePage },           // Dog profile registration
      { path: 'dog-mbti-test', Component: DogMbtiTestPage },      // Dog MBTI test
      { path: 'billing', Component: BillingPage },               // 인증 보호맘 란 7일 노출 Stripe
      { path: 'guard-moms', Component: GuardMomsPage },            // → /sitters?view=care&care=guard 리다이렉트
      { path: 'guard-mom/register', Component: GuardMomRegisterPage },
      { path: 'guard-mom/:id', Component: GuardMomDetailPage },
      { path: 'admin', Component: AdminGatePage },                 // Admin (Kakao + 지정 이메일만)
      { path: 'become-sitter', Component: BecomeDogSitterPage },  // Register as dog sitter
      { path: 'login', Component: LoginPage },                    // Login
      { path: 'signup', Component: SignupPage },                   // Sign up
      { path: 'delete-account', Component: DeleteAccountPage },   // Account deletion
      { path: 'customer-service', Component: CustomerServicePage }, // Help/FAQ
      { path: 'chats', Component: ChatsPage },                    // Chat list
      { path: 'chat/:id', Component: ChatDetailPage },            // Chat conversation
      { path: 'search', Component: SearchPage },                   // Search meetups
      { path: 'notifications', Component: NotificationsPage },    // Notifications
      { path: 'email-test', Component: EmailTestPage },           // EmailJS Test
      { path: 'my/meetups', Component: MyMeetupsPage },           // My meetups
      { path: 'my/join-requests', Component: MyJoinRequestsPage }, // My join requests
      { path: '*', Component: NotFound },                          // 404 page
    ],
  },
]);
