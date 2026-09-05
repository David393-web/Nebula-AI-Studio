# Nebula AI Studio

Nebula AI Studio helps creators build comprehensive media workflows from a single workspace. It takes basic ideas and transforms them into consistent characters, storyboard scenes, images, and videos. Users can organize all generated assets into dedicated projects to keep production running smoothly.

## System Architecture

```mermaid
flowchart LR
  WebClient["Web Client"]
  APIServer["API Server"]
  PostgreSQL[("PostgreSQL")]
  Storage["Local Storage"]
  AIProviders["AI Services"]

  WebClient -- "API Requests" --> APIServer
  APIServer -- "Reads / Writes" --> PostgreSQL
  APIServer -- "Saves Media" --> Storage
  APIServer -- "Dispatches Tasks" --> AIProviders

  style WebClient fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
  style APIServer fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
  style PostgreSQL fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
  style Storage fill:#1E1E24,stroke:#3D3B3C,stroke-width:2px,color:#fff
  style AIProviders fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff
```

## Features

### AI Creative Workspace
Users can build distinct projects that house their images, videos, storyboards, and character references in one consolidated environment. 

### Identity and Character Consistency
Teams can generate and save character profiles. These reusable character entities can be attached to new generation requests to maintain consistent visual identity across multiple shots and scenes.

### Storyboard to Video Pipeline
The platform includes a storyboard editor where creators can sequence prompts and references. Once scenes are prepared, the system compiles them into cohesive AI-generated videos.

```mermaid
sequenceDiagram
  actor User
  participant Server
  participant AI as "AI Services"
  participant Database

  User->>Server: Submit Video Generation Request
  Server->>Database: Verify Project Ownership
  Server->>AI: Send Prompt and Settings
  AI->>Server: Return Generated Media URL
  Server->>Database: Save Video Metadata
  Server->>User: Return Success Status
```

### Secure Access and Storage
The system secures user sessions via HttpOnly cookies and ensures all uploaded or generated media is strictly scoped to the authenticated owner. 

```mermaid
sequenceDiagram
  actor NewUser
  participant Server
  participant Database

  NewUser->>Server: Submit Registration Data
  Server->>Server: Hash User Password
  Server->>Database: Create User Record
  Database->>Server: Return New Profile
  Server->>Server: Generate JWT
  Server->>NewUser: Set HttpOnly Cookie
```

## Installation

Clone the Repository:
```bash
git clone https://github.com/David393-web/Nebula-AI-Studio.git
cd Nebula-AI-Studio
```

Install server dependencies:
```bash
cd server
npm install
```

Configure the server environment:
Create a `.env` file in the `server` directory and add your database and JWT secrets.
```text
DATABASE_URL="postgresql://user:password@localhost:5432/nebula?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/nebula?schema=public"
JWT_SECRET="your_secure_jwt_secret"
PORT=5000
```

Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

Install client dependencies:
```bash
cd ../client
npm install
```

Configure the client environment:
Create a `.env` file in the `client` directory.
```text
VITE_API_URL="http://localhost:5000/api"
VITE_IMAGE_API_URL="your_ai_api_endpoint"
VITE_IMAGE_API_KEY="your_ai_api_key"
```

## Usage

Run the server application:
```bash
cd server
npm run dev
```

Run the client application:
```bash
cd client
npm run dev
```

Open your browser and navigate to the local development URL provided by Vite. Register a new account to access the dashboard. From there, you can create a new project workspace, establish character profiles, and begin generating media assets through the prompt interface.

## Technologies Used

* **Frontend**: React, Vite, Tailwind CSS, Zustand, Framer Motion, React Router, React Query
* **Backend**: Node.js, Express, Prisma ORM, PostgreSQL, JSON Web Tokens (JWT), Multer
* **Infrastructure**: Docker

## API Documentation

### Authentication

#### POST /api/auth/register
**Description**: Registers a new user account and sets an HttpOnly authentication cookie.

**Request**:
```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "cuid_string",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "USER",
      "createdAt": "2023-10-25T12:00:00.000Z"
    }
  }
}
```

**Errors**:
* 400: Validation failed
* 409: Email is already registered

#### POST /api/auth/login
**Description**: Authenticates a user and sets an HttpOnly cookie.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cuid_string",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "USER"
    }
  }
}
```

**Errors**:
* 400: Validation failed
* 401: Invalid email or password

#### POST /api/auth/logout
**Description**: Clears the authentication cookie to log the user out.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /api/auth/me
**Description**: Retrieves the currently authenticated user's profile.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid_string",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "USER"
    }
  }
}
```

**Errors**:
* 401: Authentication required
* 404: User not found

### Projects

#### POST /api/projects
**Description**: Creates a new project workspace.

**Request**:
```json
{
  "name": "Commercial Campaign",
  "description": "Short film for upcoming product launch",
  "status": "DRAFT"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "cuid_string",
      "name": "Commercial Campaign",
      "description": "Short film for upcoming product launch",
      "status": "DRAFT",
      "ownerId": "user_cuid"
    }
  }
}
```

**Errors**:
* 400: Validation failed
* 401: Authentication required

#### GET /api/projects
**Description**: Retrieves all projects owned by the authenticated user.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "projects": []
  }
}
```

#### GET /api/projects/:id
**Description**: Retrieves details for a specific project.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "cuid_string",
      "name": "Commercial Campaign",
      "assets": []
    }
  }
}
```

**Errors**:
* 403: Access denied
* 404: Project not found

#### PATCH /api/projects/:id
**Description**: Updates a project's details.

**Request**:
```json
{
  "name": "Updated Campaign Title",
  "status": "ACTIVE"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": {}
  }
}
```

#### DELETE /api/projects/:id
**Description**: Deletes a project and its associated metadata.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Characters

#### POST /api/characters
**Description**: Creates a reusable character reference.

**Request**:
```json
{
  "name": "Hero Protagonist",
  "description": "Tall, wearing a blue jacket",
  "imageUrl": "https://example.com/reference.png",
  "projectId": "project_cuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Character created successfully",
  "data": {
    "character": {}
  }
}
```

**Errors**:
* 400: Validation failed
* 403: You do not have access to this project
* 404: Project not found

#### GET /api/characters
**Description**: Retrieves all character profiles for the user.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "characters": []
  }
}
```

#### GET /api/characters/:id
**Description**: Retrieves a specific character.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "character": {}
  }
}
```

#### PATCH /api/characters/:id
**Description**: Updates character reference data.

**Request**:
```json
{
  "description": "Updated character details"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Character updated successfully",
  "data": {
    "character": {}
  }
}
```

#### DELETE /api/characters/:id
**Description**: Deletes a character reference.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Character deleted successfully"
}
```

### Images

#### POST /api/images
**Description**: Saves a generated or uploaded image record.

**Request**:
```json
{
  "name": "Sunset Scene",
  "prompt": "A beautiful sunset over a futuristic city",
  "url": "https://example.com/image.png",
  "projectId": "project_cuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Image created successfully",
  "data": {
    "image": {}
  }
}
```

#### GET /api/images
**Description**: Retrieves all images owned by the user.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "images": []
  }
}
```

#### GET /api/images/:id
**Description**: Retrieves a specific image record.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "image": {}
  }
}
```

#### PATCH /api/images/:id
**Description**: Updates image metadata or favorite status.

**Request**:
```json
{
  "isFavorite": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Image updated successfully",
  "data": {
    "image": {}
  }
}
```

#### DELETE /api/images/:id
**Description**: Deletes an image record.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Videos

#### POST /api/videos
**Description**: Saves a generated video record.

**Request**:
```json
{
  "name": "Opening Sequence",
  "prompt": "Camera pans across the desert",
  "url": "https://example.com/video.mp4",
  "duration": 15,
  "projectId": "project_cuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video created successfully",
  "data": {
    "video": {}
  }
}
```

#### GET /api/videos
**Description**: Retrieves all videos for the user.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "videos": []
  }
}
```

#### GET /api/videos/project/:projectId
**Description**: Retrieves all videos associated with a specific project.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "videos": []
  }
}
```

#### GET /api/videos/:id
**Description**: Retrieves a specific video record.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "video": {}
  }
}
```

#### PATCH /api/videos/:id
**Description**: Updates video metadata.

**Request**:
```json
{
  "name": "Revised Sequence Name"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video updated successfully",
  "data": {
    "video": {}
  }
}
```

#### DELETE /api/videos/:id
**Description**: Deletes a video record.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

### Storyboards

#### POST /api/storyboards
**Description**: Creates a new storyboard sequence.

**Request**:
```json
{
  "name": "Act 1 Sequence",
  "description": "Opening scenes",
  "projectId": "project_cuid",
  "scenes": []
}
```

**Response**:
```json
{
  "success": true,
  "message": "Storyboard created successfully",
  "data": {
    "storyboard": {}
  }
}
```

#### GET /api/storyboards
**Description**: Retrieves all storyboards for the user.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "storyboards": []
  }
}
```

#### GET /api/storyboards/:id
**Description**: Retrieves a specific storyboard.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "storyboard": {}
  }
}
```

#### PATCH /api/storyboards/:id
**Description**: Updates a storyboard's scenes or metadata.

**Request**:
```json
{
  "scenes": []
}
```

**Response**:
```json
{
  "success": true,
  "message": "Storyboard updated successfully",
  "data": {
    "storyboard": {}
  }
}
```

#### DELETE /api/storyboards/:id
**Description**: Deletes a storyboard.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Storyboard deleted successfully"
}
```

### Assets

#### POST /api/assets
**Description**: Creates a generic asset record.

**Request**:
```json
{
  "name": "Background Audio",
  "type": "OTHER",
  "url": "https://example.com/audio.mp3",
  "projectId": "project_cuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Asset created successfully",
  "data": {
    "asset": {}
  }
}
```

#### GET /api/assets
**Description**: Retrieves all assets for the user.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "assets": []
  }
}
```

#### GET /api/assets/:id
**Description**: Retrieves a specific asset.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "asset": {}
  }
}
```

#### PATCH /api/assets/:id
**Description**: Updates asset information.

**Request**:
```json
{
  "name": "Updated Audio Track"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Asset updated successfully",
  "data": {
    "asset": {}
  }
}
```

#### DELETE /api/assets/:id
**Description**: Deletes an asset.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

### Gallery

#### GET /api/gallery
**Description**: Aggregates all images, characters, and assets for the user into a unified gallery view.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [],
    "counts": {
      "total": 0,
      "images": 0,
      "assets": 0,
      "characters": 0
    }
  }
}
```

#### GET /api/gallery/type/:type
**Description**: Filters the unified gallery by a specific type (IMAGE, ASSET, or CHARACTER).

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [],
    "count": 0,
    "type": "IMAGE"
  }
}
```

### Storage

#### POST /api/storage/upload
**Description**: Handles multipart form data uploads to local storage.

**Request**:
*Content-Type: multipart/form-data*
Field name: `file`

**Response**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "originalName": "image.png",
      "fileName": "123456789-image.png",
      "url": "/uploads/123456789-image.png"
    }
  }
}
```

#### DELETE /api/storage/:fileName
**Description**: Deletes a file from local storage.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Settings

#### GET /api/settings
**Description**: Retrieves the user's application settings.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "settings": {
      "theme": "dark",
      "emailNotifications": true
    }
  }
}
```

#### PATCH /api/settings
**Description**: Updates user settings.

**Request**:
```json
{
  "theme": "light"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "settings": {}
  }
}
```

#### POST /api/settings/reset
**Description**: Restores user settings to their default values.

**Request**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Settings reset successfully",
  "data": {
    "settings": {}
  }
}
```

## Contributing

We welcome contributions to Nebula AI Studio. To contribute, fork the repository, create a new branch for your feature or bug fix, and submit a pull request for review. Ensure your code follows the existing formatting conventions.

## Author

* **X (Twitter)**: https://x.com/Mhariontwk

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](#)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](#)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)