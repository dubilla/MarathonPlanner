# Marathon Training Planner

A comprehensive marathon training application that allows users to create, manage, and track their training plans with detailed progress monitoring and analytics.

## 🏃‍♂️ Features

- **Training Plan Management**: Create and upload structured training plans with weeks, days, mileage, and workout details
- **Progress Tracking**: Log actual miles and compare against planned training
- **Plan Adjustments**: Update future weeks based on progress, injuries, or life events
- **Analytics Dashboard**: Visual representation of training progress and goal projections
- **Public Sharing**: All training data is public for community motivation (no privacy controls in v1)
- **Authentication**: Secure user accounts via NextAuth.js with email/password and magic links

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+ with App Router, TypeScript, Tailwind CSS v4
- **Backend**: Neon PostgreSQL + Drizzle ORM
- **Authentication**: NextAuth.js with email/password and magic links
- **Deployment**: Vercel
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## 🔐 Authentication & Session Strategy

This application uses NextAuth.js with a **JWT session strategy** to support multiple authentication methods:

### Authentication Methods

1. **Email/Password Registration & Login** (RESTful)
   - `/users/create` - Account registration 
   - `/sessions/create` - User login
   - Passwords securely hashed with bcryptjs

2. **Magic Link Authentication**
   - Passwordless login via email links
   - Email provider configuration required

### Session Architecture

**JWT Strategy Choice:**
- We use JWT sessions (`strategy: "jwt"`) instead of database sessions
- This enables the credentials provider to work alongside the email provider
- Sessions are stored as signed JWTs in secure HTTP-only cookies

**Why JWT over Database Sessions:**
- **Credentials Provider Compatibility**: Credentials providers don't work well with database sessions
- **Stateless**: No session storage required, scales better
- **Mixed Provider Support**: Works with both email and credentials providers
- **Simpler Deployment**: No session table maintenance needed

**Database Adapter Role:**
- DrizzleAdapter handles user creation/management for email provider
- Provides user lookup functionality for credentials provider  
- Manages NextAuth tables (User, Account, VerificationToken)
- Does NOT manage sessions (handled by JWT)

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@hostname/database

# NextAuth Core (REQUIRED for JWT signing)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Email Provider (for magic links)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# UI Configuration
NEXT_PUBLIC_DB_CONFIGURED=true
```

**Critical:** `NEXTAUTH_SECRET` is required for JWT signing. Without it, sessions won't work.

### User Flow

1. **New Users**: Homepage → `/users/create` → Register → `/dashboard`
2. **Returning Users**: Header "Sign In" → `/sessions/create` → Login → `/dashboard`
3. **Protected Routes**: Unauthenticated access → Redirect to `/sessions/create`

### Route Protection

All protected routes use the `<ProtectedRoute>` component:
- Checks authentication status via `useAuth()` hook
- Redirects unauthenticated users to `/sessions/create`
- Shows loading state during auth check
- Renders protected content only when authenticated

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon account
- Email provider (Gmail recommended for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/marathon-planner.git
   cd marathon-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your database and auth credentials:
   ```env
   DATABASE_URL=postgresql://username:password@hostname/database
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your_email@gmail.com
   EMAIL_SERVER_PASSWORD=your_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

4. **Set up Neon database**
   - Create a new Neon project at [console.neon.tech](https://console.neon.tech)
   - Copy the connection string to `DATABASE_URL`
   - Run database migrations: `npm run db:push`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses the following main tables:

- `users` - User profiles and authentication
- `training_plans` - Marathon training plan metadata
- `training_weeks` - Weekly training structure
- `workouts` - Individual workout details

The schema is defined using Drizzle ORM in `src/lib/db/schema.ts`.

## 📝 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript checks

# Database
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🏗️ Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries (database, auth, etc.)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── __tests__/       # Test files
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Environment Variables for Production

```env
DATABASE_URL=your_production_database_url
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_production_secret
EMAIL_SERVER_HOST=your_production_smtp_host
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_production_email
EMAIL_SERVER_PASSWORD=your_production_email_password
EMAIL_FROM=your_production_email
```

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Testing components with database integration
- **Test Coverage**: Automated coverage reporting

Run tests with:
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow TypeScript strict mode
- Use Prettier for formatting
- Maintain test coverage above 80%
- Write descriptive commit messages

## 📋 Development Roadmap

### Phase 1: MVP ✅
- [x] Project setup and configuration
- [ ] Basic authentication
- [ ] Create/edit training plans
- [ ] Log daily workouts
- [ ] Simple progress dashboard

### Phase 2: Enhanced Tracking
- [ ] Advanced analytics and charts
- [ ] Plan templates
- [ ] Bulk import/export functionality
- [ ] Improved UX/UI

### Phase 3: Community
- [ ] Public plan sharing
- [ ] User profiles
- [ ] Plan discovery and copying
- [ ] Social features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Neon](https://neon.tech/) for serverless PostgreSQL
- [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vercel](https://vercel.com/) for hosting

## 📞 Support

If you have any questions or need help getting started, please open an issue in the GitHub repository.
