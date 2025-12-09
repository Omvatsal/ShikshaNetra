# ShikshaNetra Backend API Integration

## Overview

The ShikshaNetra backend integrates with the ML microservice running on port 8000 to provide video analysis capabilities for teaching sessions.

## Architecture

```
Frontend (Next.js) → Backend API (Port 3000) → ML Microservice (Port 8000)
                           ↓
                    MongoDB Atlas
```

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Register a new user
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe",
  "role": "mentor"
}
```

#### POST `/api/auth/login`
Login with credentials
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

Returns:
```json
{
  "message": "Login successful",
  "accessToken": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "mentor"
  }
}
```

#### POST `/api/auth/refresh`
Refresh access token using refresh token cookie

#### POST `/api/auth/logout`
Logout and clear refresh token

### Video Analysis

#### POST `/api/analyze`
Analyze a teaching video with full AI coaching feedback

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body (multipart/form-data):**
- `file`: Video file (mp4, mov, avi, mkv)
- `subject`: Subject being taught
- `language`: Language/accent

**Response:**
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "analysisId": "analysis_id_here",
  "data": {
    "session_id": "video.mp4",
    "topic": "Machine Learning",
    "transcript": "...",
    "scores": {
      "audio": {
        "clarity_score": 0.85,
        "confidence_score": 0.78
      },
      "video": {
        "engagement_score": 0.82,
        "gesture_index": 0.65,
        "dominant_emotion": "neutral"
      },
      "text": {
        "technical_depth": 0.75,
        "interaction_index": 0.68
      }
    },
    "coach_feedback": {
      "performance_summary": "...",
      "strengths": ["..."],
      "improvements": ["..."]
    }
  }
}
```

#### POST `/api/analyze/scores-only`
Faster analysis without AI coaching feedback

Same request format as `/api/analyze`, but returns only scores without AI-generated feedback.

#### GET `/api/analyze/:id`
Get a specific analysis by ID

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Analysis retrieved successfully",
  "analysis": {
    "id": "...",
    "userId": "...",
    "subject": "Machine Learning",
    "topic": "Neural Networks",
    "clarityScore": 85,
    "confidenceScore": 78,
    "engagementScore": 82,
    "technicalDepth": 75,
    "interactionIndex": 68,
    "dominantEmotion": "neutral",
    "transcript": "...",
    "coachStrengths": ["..."],
    "coachSuggestions": ["..."],
    "createdAt": "2025-12-08T..."
  }
}
```

#### GET `/api/analyze/history`
Get user's analysis history

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit`: Number of results (default: 10)
- `skip`: Number to skip for pagination (default: 0)
- `includeStats`: Include statistics (true/false)

#### GET `/api/analyze/search`
Advanced search for analyses

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `subject`: Filter by subject
- `topic`: Search in topic (regex)
- `dominantEmotion`: Filter by emotion
- `status`: Filter by status (processing/completed/failed)
- `minClarityScore`: Minimum clarity score (0-100)
- `minConfidenceScore`: Minimum confidence score (0-100)
- `minEngagementScore`: Minimum engagement score (0-100)
- `minTechnicalDepth`: Minimum technical depth (0-100)
- `fromDate`: Filter from date
- `toDate`: Filter to date
- `limit`: Results limit
- `skip`: Pagination skip

### Database Initialization

#### POST `/api/db/init`
Initialize database indexes (run once during setup)

**Headers:**
```
x-admin-secret: <ADMIN_SECRET>
```

## Environment Variables

Create a `.env.local` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# MongoDB Atlas
MONGODB_URI=

# Admin Secret
ADMIN_SECRET=your-admin-secret

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# ML Microservice
ML_MICROSERVICE_URL=http://localhost:8000

# Environment
NODE_ENV=development
```

## Database Schema

### Users Collection
```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  name: string,
  role: "mentor" | "coordinator",
  createdAt: Date,
  updatedAt: Date
}
```

### Analyses Collection
```typescript
{
  _id: ObjectId,
  userId: string,
  videoMetadata: {
    fileName: string,
    fileSize: number,
    mimeType: string
  },
  subject: string,
  language: string,
  sessionId: string,
  topic: string,
  transcript: string,
  
  // Flattened scores (0-100)
  clarityScore: number,
  confidenceScore: number,
  audioFeatures: number[],
  engagementScore: number,
  gestureIndex: number,
  dominantEmotion: string,
  technicalDepth: number,
  interactionIndex: number,
  topicMatches: {},
  topicRelevanceScore: number,
  
  // Coach feedback
  coachFeedbackError?: string,
  coachSuggestions?: string[],
  coachStrengths?: string[],
  
  // Original ML response
  mlResponse: object,
  
  status: "processing" | "completed" | "failed",
  createdAt: Date,
  updatedAt: Date
}
```

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install mongodb jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
   ```

2. **Configure Environment:**
   - Copy `.env.example` to `.env.local`
   - Update MongoDB URI with your Atlas connection string
   - Set JWT secrets
   - Set admin secret

3. **Start ML Microservice:**
   ```bash
   cd ml-service
   python api.py
   ```
   Service should be running on http://localhost:8000

4. **Initialize Database Indexes:**
   ```bash
   curl -X POST http://localhost:3000/api/db/init \
     -H "x-admin-secret: your-admin-secret"
   ```

5. **Start Next.js Server:**
   ```bash
   npm run dev
   ```
   Server will be running on http://localhost:3000

## Testing the Integration

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "name": "Test User",
    "role": "mentor"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

Save the `accessToken` from the response.

### 3. Analyze a Video
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@video.mp4" \
  -F "subject=Machine Learning" \
  -F "language=English"
```

### 4. Get Analysis History
```bash
curl http://localhost:3000/api/analyze/history?limit=5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found
- `409`: Conflict
- `500`: Internal server error
- `503`: Service unavailable (ML service down)

## Features

✅ JWT authentication with access & refresh tokens  
✅ MongoDB Atlas integration  
✅ Flattened data structure for efficient querying  
✅ Database indexes for optimized searches  
✅ Full ML microservice integration  
✅ Scores-only fast analysis option  
✅ Analysis history and search  
✅ Type-safe with TypeScript  
✅ Error handling and logging  

## Support

For issues or questions, check the ML service documentation at http://localhost:8000/docs
