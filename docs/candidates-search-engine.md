# Candidates Search Engine Documentation

## Overview

The Candidates Search Engine is a comprehensive job candidate discovery platform that allows organizations to search for, filter, and connect with qualified professionals. The system is built with a modular architecture using reusable utilities and hooks.

## Architecture

### File Structure

\`\`\`
app/candidates-searchengine/
├── page.tsx                          # Main page with metadata
└── [candidateId]/page.tsx            # Candidate detail page

components/public/candidates-search/
├── CandidatesSearchEngine.tsx        # Main search component
├── CandidatesSearchEngineClientPage.tsx  # Client wrapper
├── CandidateDetailPage.tsx           # Detail view component
├── CandidatesHeroSlider.tsx          # Hero section slider
└── index.ts                          # Barrel export

lib/
├── candidate-search-utils.ts         # Core filtering and data utilities
└── whatsapp-integration.ts           # WhatsApp integration utilities

hooks/
└── use-candidate-search.ts           # React hooks for search state

api/
└── candidates/search/route.ts        # API endpoint for fetching candidates
\`\`\`

## Key Components

### 1. Candidate Search Utilities (`lib/candidate-search-utils.ts`)

Core utilities for searching, filtering, and managing candidate data.

#### Functions

- **filterBySearchTerm(candidates, searchTerm)** - Search across name, position, location, education, and email
- **filterByCountry(candidates, country)** - Filter by country
- **filterByLocation(candidates, location)** - Filter by specific location
- **filterByRelocation(candidates, relocation)** - Filter by relocation willingness
- **filterByEducation(candidates, education)** - Filter by education level
- **applyAllFilters(candidates, filters)** - Apply all filters at once
- **sortCandidates(candidates, sortBy, ascending)** - Sort candidates by name, location, or date
- **paginateCandidates(candidates, page, itemsPerPage)** - Get paginated results
- **fetchCandidates()** - Fetch all candidates from API
- **fetchCandidateById(id)** - Fetch single candidate by ID

#### Usage Example

\`\`\`typescript
import {
  filterBySearchTerm,
  filterByCountry,
  applyAllFilters,
  fetchCandidates,
} from "@/lib/candidate-search-utils"

// Fetch and filter candidates
const candidates = await fetchCandidates()
const filtered = applyAllFilters(candidates, {
  searchTerm: "marketing",
  country: "Ghana",
  location: "Accra",
})
\`\`\`

### 2. WhatsApp Integration (`lib/whatsapp-integration.ts`)

Utilities for WhatsApp-based CV request functionality.

#### Functions

- **maskPhoneNumber(phone)** - Mask phone numbers for privacy (shows first 4 digits)
- **maskEmail(email)** - Mask emails for privacy
- **getAbridgedName(fullName)** - Get abbreviated name (first name + last initial)
- **generateCVRequestMessage(options)** - Generate WhatsApp message
- **createWhatsAppURL(message, phoneNumber)** - Create WhatsApp URL
- **openWhatsAppCVRequest(options, phoneNumber)** - Open WhatsApp with pre-filled message

#### Usage Example

\`\`\`typescript
import { openWhatsAppCVRequest } from "@/lib/whatsapp-integration"

const handleRequestCV = (candidate) => {
  openWhatsAppCVRequest({
    candidateName: candidate.full_name,
    candidateEmail: candidate.email,
    position: candidate.job_looking_for,
    location: candidate.exact_location,
    country: candidate.country,
  })
}
\`\`\`

### 3. Candidate Search Hook (`hooks/use-candidate-search.ts`)

React hook for managing candidate search state and filtering.

#### useCandidateSearch Hook

\`\`\`typescript
const {
  candidates,           // All candidates
  filteredCandidates,  // Filtered candidates
  paginatedCandidates, // Current page candidates
  loading,             // Loading state
  error,               // Error message
  totalPages,          // Total pages
  currentPage,         // Current page number
  filters,             // Current filter values
  updateSearch,        // Update search term
  updateCountry,       // Update country filter
  updateLocation,      // Update location filter
  updateRelocation,    // Update relocation filter
  updateEducation,     // Update education filter
  setCurrentPage,      // Change page
  resetFilters,        // Reset all filters
  refreshCandidates,   // Refresh data from API
} = useCandidateSearch(itemsPerPage)
\`\`\`

#### Usage Example

\`\`\`typescript
import { useCandidateSearch } from "@/hooks/use-candidate-search"

export function MySearchComponent() {
  const {
    paginatedCandidates,
    filteredCandidates,
    updateSearch,
    updateCountry,
  } = useCandidateSearch(12)

  return (
    <div>
      <input
        onChange={(e) => updateSearch(e.target.value)}
        placeholder="Search candidates..."
      />
      <select onChange={(e) => updateCountry(e.target.value)}>
        <option>All Countries</option>
        <option>Ghana</option>
        <option>Nigeria</option>
      </select>
      <div>Found {filteredCandidates.length} candidates</div>
      {paginatedCandidates.map((candidate) => (
        <div key={candidate.id}>{candidate.full_name}</div>
      ))}
    </div>
  )
}
\`\`\`

### 4. API Route (`app/api/candidates/search/route.ts`)

Endpoint for fetching candidates from Supabase.

#### Endpoints

- **GET /api/candidates/search** - Get all candidates
- **GET /api/candidates/search?id={id}** - Get single candidate by ID

#### Response Format

\`\`\`typescript
interface Response {
  candidates?: CandidateProfile[]
  candidate?: CandidateProfile
  message?: string
}
\`\`\`

## Features

### Search

- Full-text search across multiple fields
- Search by name, position, location, education, or email
- Real-time filtering

### Filtering

- By country (Ghana, Nigeria, Kenya, Cameroon, Other)
- By location (Ghanaian cities)
- By relocation willingness
- By education level
- Multiple filters can be combined

### Sorting

- By name (A-Z)
- By date (newest first)
- By location

### Pagination

- Configurable items per page
- Page navigation
- Dynamic page calculations

### Privacy Protection

- Masked phone numbers (shows first 4 digits)
- Masked email addresses (shows first letter + domain)
- Abbreviated names (first name + last initial)

### WhatsApp Integration

- Direct CV request via WhatsApp
- Pre-filled message templates
- Candidate information included in requests

## Data Structure

### CandidateProfile

\`\`\`typescript
interface CandidateProfile {
  id: string
  full_name: string
  email: string
  contact_lines: string
  country: string
  exact_location: string
  willingness_to_relocate: string
  job_looking_for: string
  highest_education: string
  created_at: string
  // Optional fields
  relative_contact?: string
  job_abroad?: string
  preferred_countries?: string
  future_learning_plans?: string
  career_aspirations?: string
}
\`\`\`

## Integration Examples

### Creating a Custom Search Component

\`\`\`typescript
"use client"
import { useCandidateSearch } from "@/hooks/use-candidate-search"
import { openWhatsAppCVRequest } from "@/lib/whatsapp-integration"

export function CustomSearch() {
  const {
    paginatedCandidates,
    filteredCandidates,
    loading,
    filters,
    updateSearch,
    updateCountry,
  } = useCandidateSearch()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <input
        value={filters.searchTerm}
        onChange={(e) => updateSearch(e.target.value)}
        placeholder="Search..."
      />
      {paginatedCandidates.map((candidate) => (
        <div key={candidate.id}>
          <h3>{candidate.full_name}</h3>
          <p>{candidate.job_looking_for}</p>
          <button
            onClick={() => openWhatsAppCVRequest({ ...candidate })}
          >
            Request CV
          </button>
        </div>
      ))}
    </div>
  )
}
\`\`\`

## Performance Optimization

- Pagination reduces rendering load (12 candidates per page by default)
- Filtering is performed client-side for instant results
- Lazy loading of candidate details
- Cached candidate data with refresh capability

## Accessibility Features

- Semantic HTML structure
- Proper heading hierarchy
- Icon + text labels for buttons
- Mobile-responsive design
- Screen reader friendly

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Minimum resolution: 320px (mobile)

## Troubleshooting

### No candidates appearing

1. Check API endpoint is responding: `GET /api/candidates/search`
2. Verify Supabase connection and form_responses table exists
3. Check browser console for errors

### WhatsApp not opening

1. Ensure WhatsApp is installed or web version is available
2. Check phone number format (should start with country code)
3. Verify message URL encoding

### Filtering not working

1. Clear browser cache and refresh
2. Check filter values are being set correctly
3. Verify candidates array is populated
