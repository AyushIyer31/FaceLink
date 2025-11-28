# FaceLink Backend Architecture Plan

## Project Overview
FaceLink is a healthcare application designed to help people with dementia stay oriented by:
- Recognizing familiar faces via camera
- Showing context about recognized people
- Providing a "Help" button with reassurance and caregiver contacts
- Managing calendar/tasks for daily activities
- Displaying location information ("You are at home")
- Maintaining a timeline of recognition events

---

## Technology Stack Recommendation

### Core Framework
- **Node.js + Express.js** (TypeScript)
  - Simple, mature, widely supported
  - Easy integration with frontend Next.js
  - Good for RESTful APIs

### Database
- **PostgreSQL** with **Prisma ORM**
  - Relational data (people, events, tasks)
  - Strong typing with Prisma
  - Easy migrations and schema management
  
**Alternative**: SQLite for simpler deployment (single file, no server needed)

### Authentication
- **Simple session-based auth** or **JWT tokens**
  - For hackathon: Mock user or single-user mode
  - Production: Add proper auth later

### Additional Tools
- **dotenv** - Environment configuration
- **zod** - Request validation
- **date-fns** - Date/time handling
- **cors** - Frontend-backend communication

---

## Database Schema Design

### 1. User Model
```typescript
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  people        Person[]
  timelineEvents TimelineEvent[]
  tasks         Task[]
  settings      Settings?
}
```

### 2. Person Model (Known People/Faces)
```typescript
model Person {
  id            String    @id @default(uuid())
  name          String
  relationship  String    // "Daughter", "Son", "Doctor", etc.
  reminder      String    // Notes about the person
  photoUrl      String?   // Optional: stored face photo
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  recognitionEvents TimelineEvent[]
}
```

### 3. TimelineEvent Model (Recognition History)
```typescript
model TimelineEvent {
  id            String    @id @default(uuid())
  eventType     String    // "recognition", "confused", "help_requested"
  timestamp     DateTime  @default(now())
  notes         String?   // Optional additional context
  
  // For recognition events
  personId      String?
  person        Person?   @relation(fields: [personId], references: [id], onDelete: SetNull)
  
  // Relations
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, timestamp])
}
```

### 4. Task Model (Calendar/Schedule)
```typescript
model Task {
  id            String    @id @default(uuid())
  title         String
  description   String?
  time          String    // "9:00 AM", "3:00 PM" - stored as string for simplicity
  date          DateTime  // Which day this task is for
  completed     Boolean   @default(false)
  reminder      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, date])
}
```

### 5. Settings Model (Reassurance Configuration)
```typescript
model Settings {
  id                    String    @id @default(uuid())
  homeAddress           String    // "742 Maple Street, Seattle, WA"
  homeLabel             String    @default("home")
  reassuranceMessage    String    // "You are at home. Everything is okay."
  mapLatitude           Float?    // For map display
  mapLongitude          Float?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  caregivers    Caregiver[]
}
```

### 6. Caregiver Model (Emergency Contacts)
```typescript
model Caregiver {
  id            String    @id @default(uuid())
  name          String
  relationship  String    // "Daughter", "Son", "Primary Caregiver"
  phoneNumber   String
  email         String?
  isPrimary     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  
  // Relations
  settingsId    String
  settings      Settings  @relation(fields: [settingsId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoint Design

### Base URL: `/api/v1`

### Authentication Endpoints
```
POST   /auth/login          # Simple login (or mock for hackathon)
POST   /auth/logout         # Logout
GET    /auth/me             # Get current user info
```

---

### People Management Endpoints

#### List all people
```
GET /people
Response: {
  people: Person[]
}
```

#### Get specific person
```
GET /people/:id
Response: {
  person: Person
}
```

#### Add new person
```
POST /people
Body: {
  name: string
  relationship: string
  reminder: string
  photoUrl?: string
}
Response: {
  person: Person
}
```

#### Update person
```
PUT /people/:id
Body: {
  name?: string
  relationship?: string
  reminder?: string
  photoUrl?: string
}
Response: {
  person: Person
}
```

#### Delete person
```
DELETE /people/:id
Response: {
  success: boolean
}
```

---

### Recognition & Timeline Endpoints

#### Simulate face recognition
```
POST /recognize
Body: {
  personId?: string  # If null, "unknown person"
}
Response: {
  person: Person | null
  timelineEvent: TimelineEvent
  message: string
}
```

#### Get timeline events
```
GET /timeline?date=2025-11-26&range=day|week
Query params:
  - date: ISO date string
  - range: "day" or "week"
Response: {
  events: TimelineEvent[]
  startDate: string
  endDate: string
}
```

#### Get today's timeline
```
GET /timeline/today
Response: {
  events: TimelineEvent[]
}
```

---

### Calendar/Task Endpoints

#### List tasks for a date
```
GET /tasks?date=2025-11-26
Query params:
  - date: ISO date string (defaults to today)
Response: {
  tasks: Task[]
  date: string
}
```

#### Get upcoming tasks
```
GET /tasks/upcoming?limit=5
Response: {
  tasks: Task[]
}
```

#### Create task
```
POST /tasks
Body: {
  title: string
  description?: string
  time: string        # "9:00 AM"
  date: string        # ISO date
  reminder?: boolean
}
Response: {
  task: Task
}
```

#### Update task
```
PUT /tasks/:id
Body: {
  title?: string
  description?: string
  time?: string
  date?: string
  completed?: boolean
  reminder?: boolean
}
Response: {
  task: Task
}
```

#### Delete task
```
DELETE /tasks/:id
Response: {
  success: boolean
}
```

---

### Help/Reassurance Endpoints

#### Trigger help request
```
POST /help
Body: {
  notes?: string  # Optional context
}
Response: {
  reassuranceMessage: string
  homeAddress: string
  homeLabel: string
  location: {
    latitude: number
    longitude: number
  }
  caregivers: Caregiver[]
  timelineEvent: TimelineEvent
}
```

---

### Settings Endpoints

#### Get settings
```
GET /settings
Response: {
  settings: Settings & {
    caregivers: Caregiver[]
  }
}
```

#### Update settings
```
PUT /settings
Body: {
  homeAddress?: string
  homeLabel?: string
  reassuranceMessage?: string
  mapLatitude?: number
  mapLongitude?: number
}
Response: {
  settings: Settings
}
```

#### Add caregiver
```
POST /settings/caregivers
Body: {
  name: string
  relationship: string
  phoneNumber: string
  email?: string
  isPrimary?: boolean
}
Response: {
  caregiver: Caregiver
}
```

#### Update caregiver
```
PUT /settings/caregivers/:id
Body: {
  name?: string
  relationship?: string
  phoneNumber?: string
  email?: string
  isPrimary?: boolean
}
Response: {
  caregiver: Caregiver
}
```

#### Delete caregiver
```
DELETE /settings/caregivers/:id
Response: {
  success: boolean
}
```

---

## Project Structure

```
Backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app setup
│   ├── config/
│   │   ├── database.ts          # Prisma client
│   │   └── env.ts               # Environment variables
│   ├── middleware/
│   │   ├── auth.ts              # Authentication middleware
│   │   ├── errorHandler.ts     # Global error handling
│   │   └── validation.ts        # Request validation
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── people.routes.ts
│   │   ├── timeline.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── help.routes.ts
│   │   └── settings.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── people.controller.ts
│   │   ├── timeline.controller.ts
│   │   ├── tasks.controller.ts
│   │   ├── help.controller.ts
│   │   └── settings.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── people.service.ts
│   │   ├── timeline.service.ts
│   │   ├── tasks.service.ts
│   │   └── settings.service.ts
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   └── utils/
│       ├── logger.ts            # Logging utility
│       └── helpers.ts           # Helper functions
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Seed data for testing
│   └── migrations/              # Database migrations
├── tests/                       # Unit and integration tests
├── .env.example                 # Environment template
├── .env                         # Environment variables (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Implementation Phases

### Phase 1: Project Setup ✓
- [x] Initialize Node.js + TypeScript project
- [x] Install dependencies (Express, Prisma, etc.)
- [x] Configure Prisma with PostgreSQL/SQLite
- [x] Set up basic Express server with CORS
- [x] Create project structure

### Phase 2: Database & Models
- [ ] Define Prisma schema with all models
- [ ] Run initial migration
- [ ] Create seed data for testing
- [ ] Test database connections

### Phase 3: Core API - People Management
- [ ] Implement people routes & controllers
- [ ] CRUD operations for Person model
- [ ] Test with Postman/Thunder Client
- [ ] Add validation

### Phase 4: Recognition & Timeline
- [ ] Implement recognition endpoint (simulate for now)
- [ ] Create timeline event logging
- [ ] Timeline retrieval (day/week filtering)
- [ ] Test recognition flow

### Phase 5: Calendar/Tasks
- [ ] Implement task CRUD operations
- [ ] Date filtering and upcoming tasks
- [ ] Task completion tracking
- [ ] Test calendar endpoints

### Phase 6: Help & Settings
- [ ] Implement help endpoint
- [ ] Settings management (home address, reassurance message)
- [ ] Caregiver contact management
- [ ] Test help flow

### Phase 7: Authentication (Optional for Hackathon)
- [ ] Simple JWT or session auth
- [ ] Or: Single-user mock mode for demo
- [ ] Protect routes with middleware

### Phase 8: Testing & Polish
- [ ] Test all endpoints
- [ ] Error handling
- [ ] Logging
- [ ] API documentation (optional: Swagger)

### Phase 9: Frontend Integration
- [ ] Update frontend to call backend APIs
- [ ] Replace mock data with real API calls
- [ ] Test full flow

---

## Key Features & Business Logic

### Recognition Flow
1. Frontend captures video frame
2. Sends to `/recognize` endpoint (with optional personId for simulation)
3. Backend creates TimelineEvent with type "recognition"
4. Returns person details + new timeline event
5. Frontend displays person info card

### Help Button Flow
1. User clicks "I'm Confused / Help"
2. Frontend calls `/help` endpoint
3. Backend:
   - Creates TimelineEvent with type "confused"
   - Fetches settings (home address, reassurance message)
   - Fetches caregiver list
   - Returns all data
4. Frontend displays:
   - "You are at [homeLabel]" banner
   - Reassurance message
   - Caregiver contact buttons
   - Optional: Text-to-speech for reassurance

### Timeline View
- Shows recognition events for selected day
- Filters by date range (today, this week)
- Displays person name, relationship, timestamp
- Ordered by most recent first

### Calendar View
- Shows tasks for selected date (default: today)
- Highlights upcoming vs. past tasks
- Large, readable text for accessibility
- Mark tasks as completed

### Location View
- Fetches settings for home address
- Displays "You are at home" banner
- Shows map with coordinates
- Lists important nearby locations

---

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/facelink"
# Or for SQLite:
# DATABASE_URL="file:./dev.db"

# Authentication (optional)
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Optional: External Services
# For future: Face recognition API keys, SMS service, etc.
```

---

## Sample Data Structure

### Sample Person
```json
{
  "id": "uuid",
  "name": "Anika",
  "relationship": "Daughter",
  "reminder": "Lives in Seattle. Works as a teacher. Loves gardening.",
  "photoUrl": null,
  "createdAt": "2025-11-26T10:00:00Z",
  "updatedAt": "2025-11-26T10:00:00Z"
}
```

### Sample TimelineEvent
```json
{
  "id": "uuid",
  "eventType": "recognition",
  "timestamp": "2025-11-26T14:30:00Z",
  "notes": null,
  "personId": "uuid",
  "person": {
    "name": "Anika",
    "relationship": "Daughter"
  }
}
```

### Sample Task
```json
{
  "id": "uuid",
  "title": "Doctor Appointment",
  "description": "Dr. Lee - Regular checkup",
  "time": "3:00 PM",
  "date": "2025-11-26",
  "completed": false,
  "reminder": true
}
```

### Sample Settings
```json
{
  "id": "uuid",
  "homeAddress": "742 Maple Street, Seattle, WA 98102",
  "homeLabel": "home",
  "reassuranceMessage": "You are at home. Everything is okay. Anika is nearby.",
  "mapLatitude": 47.6280,
  "mapLongitude": -122.3270,
  "caregivers": [
    {
      "id": "uuid",
      "name": "Anika",
      "relationship": "Daughter",
      "phoneNumber": "+1-206-555-0123",
      "email": "anika@example.com",
      "isPrimary": true
    },
    {
      "id": "uuid",
      "name": "Ravi",
      "relationship": "Son",
      "phoneNumber": "+1-206-555-0456",
      "email": "ravi@example.com",
      "isPrimary": false
    }
  ]
}
```

---

## Future Enhancements (Post-Hackathon)

### Face Recognition Integration
- Integrate with ML model (TensorFlow.js, Face-API.js)
- Store face embeddings in database
- Real-time face detection and matching

### Notifications
- SMS alerts to caregivers on "Help" button
- Email notifications for missed tasks
- Push notifications to caregiver app

### Voice Assistant
- Text-to-speech for reassurance messages
- Voice commands: "Who is this person?"
- Read calendar events aloud

### Analytics
- Recognition patterns over time
- Confusion event frequency
- Task completion rates
- Generate reports for healthcare providers

### Multi-User Support
- Full authentication system
- Caregiver portal
- Multiple dementia patients per caregiver account

### Offline Mode
- PWA with service workers
- Local storage fallback
- Sync when online

### Mobile Apps
- React Native companion app
- Caregiver mobile dashboard
- Emergency response features

---

## Testing Strategy

### Unit Tests
- Test each service function independently
- Mock database calls
- Test validation logic

### Integration Tests
- Test full API endpoints
- Use test database
- Test error scenarios

### End-to-End Tests
- Test complete user flows
- Frontend + Backend integration
- Use Playwright or Cypress

---

## Deployment Considerations

### For Hackathon Demo
- **Local**: Run on localhost with SQLite
- **Quick Deploy**: Railway, Render, or Fly.io
- **Database**: Railway PostgreSQL or SQLite file

### Production Ready
- **Backend**: AWS EC2, DigitalOcean, or Heroku
- **Database**: AWS RDS, Supabase, or managed PostgreSQL
- **Frontend**: Vercel (already Next.js optimized)
- **CDN**: Cloudflare for static assets
- **Monitoring**: Sentry for error tracking

---

## Security Considerations

1. **Input Validation**: Validate all user inputs with Zod
2. **SQL Injection**: Use Prisma (ORM prevents SQL injection)
3. **Rate Limiting**: Prevent API abuse
4. **CORS**: Configure properly for frontend domain
5. **Authentication**: Secure JWT tokens or sessions
6. **Environment Variables**: Never commit secrets
7. **HTTPS**: Use SSL in production
8. **Data Privacy**: HIPAA compliance for healthcare data (if production)

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [ ... ]
  }
}
```

---

## Next Steps

1. **Review this plan** - Ensure alignment with frontend needs
2. **Choose database** - PostgreSQL (scalable) or SQLite (simple)
3. **Set up project** - Initialize Node.js + TypeScript + Prisma
4. **Start coding** - Begin with database schema and people endpoints
5. **Iterate quickly** - Build one feature at a time, test as you go

---

## Questions to Consider

1. **Authentication**: Mock user or simple JWT for hackathon?
2. **Database**: PostgreSQL or SQLite for simplicity?
3. **Face Recognition**: Simulate now, or integrate basic library?
4. **Deployment**: Local demo or deploy to cloud?
5. **Real-time**: WebSockets for live updates or polling?

---

## Summary

This backend will provide:
- ✅ RESTful API for all frontend features
- ✅ Database models for people, timeline, tasks, settings
- ✅ Recognition simulation (ready for ML integration)
- ✅ Help endpoint with reassurance and caregiver contacts
- ✅ Calendar/task management
- ✅ Settings for home location and caregivers
- ✅ Clear separation of concerns (routes → controllers → services)
- ✅ Type-safe with TypeScript and Prisma
- ✅ Ready for frontend integration

**Ready to start coding when you give the signal!** 🚀
