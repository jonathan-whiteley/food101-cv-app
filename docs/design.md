# Technical Design Document
## Food 101 Image Classification App

---

## High-Level Architecture

### System Overview

```
┌─────────────────┐
│   Web Browser   │
│   (React UI)    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────────────────────────────┐
│     Databricks App Platform             │
│  ┌──────────────────────────────────┐   │
│  │   Frontend (React + Vite)        │   │
│  │   - shadcn/ui components         │   │
│  │   - Image upload UI              │   │
│  │   - Results display              │   │
│  └──────────────┬───────────────────┘   │
│                 │ /api/classify          │
│  ┌──────────────▼───────────────────┐   │
│  │   Backend (FastAPI)              │   │
│  │   - Image processing             │   │
│  │   - Model serving client         │   │
│  │   - Authentication (SP)          │   │
│  └──────────────┬───────────────────┘   │
└─────────────────┼───────────────────────┘
                  │ Bearer Token Auth
                  │ HTTPS/REST
         ┌────────▼────────────┐
         │  Databricks         │
         │  Model Serving      │
         │  Endpoint           │
         │  (food101-cv-       │
         │   conformal)        │
         └─────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite (fast HMR, optimized builds)
- **UI Components:** shadcn/ui (modern, accessible components)
- **Styling:** Tailwind CSS (utility-first, responsive)
- **HTTP Client:** Auto-generated FastAPI client (type-safe)
- **State Management:** React hooks (useState, useEffect)
- **File Handling:** HTML5 File API + drag-and-drop

#### Backend
- **Framework:** FastAPI (async, automatic OpenAPI)
- **HTTP Client:** httpx (async HTTP requests)
- **Image Processing:** Python built-in (base64 encoding)
- **Authentication:** Databricks SDK (service principal)
- **Runtime:** Python 3.11+ with uvicorn

#### Deployment
- **Platform:** Databricks Apps
- **Package Manager:** uv (Python), bun (frontend)
- **Dev Workflow:** Hot reload (watch.sh)
- **Deployment:** Automated via deploy.sh

---

## Libraries and Frameworks

### Frontend Dependencies (Already Available)
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.8.3",
  "@radix-ui/react-*": "shadcn/ui components",
  "tailwindcss": "^3.4.17",
  "lucide-react": "icons",
  "class-variance-authority": "component variants",
  "tailwind-merge": "utility merging"
}
```

### Backend Dependencies
```python
# Already in pyproject.toml
fastapi = "^0.115.0"
uvicorn = "^0.30.0"
databricks-sdk = "^0.59.0"

# Need to add
httpx = "^0.27.0"  # For async HTTP requests to model endpoint
python-multipart = "^0.0.12"  # For file upload handling
```

### New shadcn/ui Components Needed
```bash
# Will add during implementation
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add progress
npx shadcn@latest add alert
```

---

## Data Architecture

### Data Flow

1. **Upload Flow:**
   ```
   User selects image → File object in browser →
   Base64 preview (optional) →
   FormData upload to /api/classify →
   Backend receives multipart file
   ```

2. **Processing Flow:**
   ```
   FastAPI endpoint receives file →
   Read file bytes →
   Base64 encode →
   Construct dataframe_split payload →
   POST to model serving endpoint →
   Parse JSON response →
   Return to frontend
   ```

3. **Display Flow:**
   ```
   Frontend receives JSON →
   Extract top_prediction, top_score →
   Extract prediction_set, prediction_scores →
   Render results with confidence bars
   ```

### API Request/Response Schemas

#### Frontend → Backend
**POST /api/classify**
```typescript
// Request (multipart/form-data)
FormData {
  image: File  // JPG, PNG (max 10MB)
}

// Response
{
  top_prediction: string,      // "pizza"
  top_score: number,           // 0.85
  prediction_set: string[],    // ["pizza", "flatbread", ...]
  prediction_scores: number[], // [0.85, 0.72, ...]
  set_size: number            // 4
}
```

#### Backend → Model Serving Endpoint
**POST /serving-endpoints/food101-cv-conformal-endpoint/invocations**
```python
# Request
{
  "dataframe_split": {
    "columns": ["image_bytes"],
    "data": [[base64_encoded_image_string]]
  }
}

# Response
{
  "predictions": [{
    "prediction_set": ["pizza", "flatbread", "bruschetta", "focaccia"],
    "prediction_scores": [0.85, 0.72, 0.68, 0.62],
    "set_size": 4,
    "top_prediction": "pizza",
    "top_score": 0.85
  }]
}
```

---

## Integration Points

### 1. Databricks Model Serving Endpoint

**Endpoint Details:**
- **Name:** food101-cv-conformal-endpoint
- **URL:** `https://e2-demo-field-eng.cloud.databricks.com/serving-endpoints/food101-cv-conformal-endpoint/invocations`
- **Authentication:** Bearer token (App service principal)
- **Expected Latency:**
  - Cold start: 3-5 minutes (if endpoint needs to spin up)
  - Hot: < 2 seconds

**Integration Strategy:**
```python
# Use Databricks SDK to get service principal token
from databricks.sdk import WorkspaceClient

w = WorkspaceClient()
token = w.config.token  # App SP token

# Make async request with httpx
async with httpx.AsyncClient() as client:
    response = await client.post(
        url=endpoint_url,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json=payload,
        timeout=300.0  # 5 min timeout for cold start
    )
```

### 2. File Upload Handling

**Frontend:**
```typescript
// Drag-and-drop + file picker
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.classify(formData);
  // Display results
}
```

**Backend:**
```python
from fastapi import UploadFile

@router.post("/api/classify")
async def classify_image(image: UploadFile):
    # Read file bytes
    image_bytes = await image.read()

    # Validate file type
    if image.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Invalid file type")

    # Validate file size (10MB)
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large")

    # Base64 encode
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    # Call model endpoint
    result = await call_model_endpoint(image_b64)
    return result
```

---

## Implementation Plan

### Phase 1: Core Backend Infrastructure (MVP)

#### Task 1.1: Add Required Dependencies
**File:** `pyproject.toml`
```bash
# Add httpx and python-multipart
uv add httpx python-multipart
```

#### Task 1.2: Create Model Serving Client
**New File:** `server/services/model_client.py`
```python
import base64
import httpx
from databricks.sdk import WorkspaceClient
from typing import Dict, Any

class ModelServingClient:
    def __init__(self):
        self.w = WorkspaceClient()
        self.endpoint_url = (
            f"{self.w.config.host}/serving-endpoints/"
            "food101-cv-conformal-endpoint/invocations"
        )

    async def classify_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Classify food image using model serving endpoint.

        Args:
            image_bytes: Raw image bytes (JPG/PNG)

        Returns:
            Dictionary with prediction results
        """
        # Base64 encode image
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')

        # Prepare payload
        payload = {
            'dataframe_split': {
                'columns': ['image_bytes'],
                'data': [[image_b64]]
            }
        }

        # Get token from workspace client
        token = self.w.config.token

        # Make request with long timeout for cold start
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                self.endpoint_url,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                },
                json=payload
            )
            response.raise_for_status()

        # Parse response
        result = response.json()

        # Extract predictions (response format: {"predictions": [...]})
        prediction = result['predictions'][0]

        return {
            'top_prediction': prediction['top_prediction'],
            'top_score': prediction['top_score'],
            'prediction_set': prediction['prediction_set'],
            'prediction_scores': prediction['prediction_scores'],
            'set_size': prediction['set_size']
        }
```

#### Task 1.3: Create Classification API Endpoint
**New File:** `server/routers/classify.py`
```python
from fastapi import APIRouter, UploadFile, HTTPException
from server.services.model_client import ModelServingClient

router = APIRouter()
model_client = ModelServingClient()

@router.post("/api/classify")
async def classify_image(image: UploadFile):
    """
    Classify uploaded food image.

    Args:
        image: Uploaded image file (JPG/PNG)

    Returns:
        Classification results with prediction set
    """
    # Validate content type
    allowed_types = ["image/jpeg", "image/png"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPG and PNG are supported."
        )

    # Read file bytes
    image_bytes = await image.read()

    # Validate file size (10MB max)
    max_size = 10 * 1024 * 1024
    if len(image_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )

    try:
        # Call model serving endpoint
        result = await model_client.classify_image(image_bytes)
        return result

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Model serving endpoint error: {e.response.text}"
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Model serving endpoint timeout. Endpoint may be starting up."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Classification error: {str(e)}"
        )
```

#### Task 1.4: Register Router in App
**File:** `server/app.py`
```python
# Add import
from server.routers import classify

# Register router (add after existing routers)
app.include_router(classify.router)
```

#### Task 1.5: Generate TypeScript Client
```bash
# After backend changes, regenerate client
uv run python scripts/make_fastapi_client.py
```

---

### Phase 2: Frontend UI Implementation

#### Task 2.1: Add shadcn/ui Components
```bash
cd client
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add progress
npx shadcn@latest add alert
```

#### Task 2.2: Create Image Upload Component
**New File:** `client/src/components/ImageUpload.tsx`
```typescript
import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  previewUrl?: string;
}

export function ImageUpload({ onImageSelect, previewUrl }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  return (
    <Card
      className={`p-8 border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {previewUrl ? (
        <div className="space-y-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
          />
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
              Change Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Drop your food image here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <Button onClick={() => document.getElementById('file-input')?.click()}>
            Select Image
          </Button>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileInput}
        className="hidden"
      />
    </Card>
  );
}
```

#### Task 2.3: Create Results Display Component
**New File:** `client/src/components/ClassificationResults.tsx`
```typescript
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ClassificationResultsProps {
  topPrediction: string;
  topScore: number;
  predictionSet: string[];
  predictionScores: number[];
}

export function ClassificationResults({
  topPrediction,
  topScore,
  predictionSet,
  predictionScores
}: ClassificationResultsProps) {

  const getConfidenceColor = (score: number) => {
    if (score > 0.7) return 'bg-green-500';
    if (score > 0.4) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceTextColor = (score: number) => {
    if (score > 0.7) return 'text-green-600';
    if (score > 0.4) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-6">
      {/* Top Prediction */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Top Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-3xl font-bold capitalize">{topPrediction}</p>
            <p className={`text-xl font-semibold ${getConfidenceTextColor(topScore)}`}>
              {(topScore * 100).toFixed(1)}% confidence
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Set */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Prediction Set ({predictionSet.length} possibilities)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictionSet.map((label, idx) => {
              const score = predictionScores[idx];
              const percentage = (score * 100).toFixed(1);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">{label}</span>
                    <span className={`font-semibold ${getConfidenceTextColor(score)}`}>
                      {percentage}%
                    </span>
                  </div>
                  <Progress
                    value={score * 100}
                    className="h-2"
                    indicatorClassName={getConfidenceColor(score)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Task 2.4: Replace WelcomePage with Classification Page
**File:** `client/src/pages/WelcomePage.tsx` → **REPLACE WITH:**

**New File:** `client/src/pages/ClassificationPage.tsx`
```typescript
import React, { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { ClassificationResults } from '@/components/ClassificationResults';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/fastapi_client';

interface ClassificationResult {
  top_prediction: string;
  top_score: number;
  prediction_set: string[];
  prediction_scores: number[];
  set_size: number;
}

export default function ClassificationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const handleClassify = async () => {
    if (!selectedFile) return;

    setIsClassifying(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/classify', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Classification failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Food 101 Classifier</h1>
          <p className="text-muted-foreground">
            Upload a food image to classify it using conformal prediction
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Upload Section */}
          <div className="space-y-4">
            <ImageUpload
              onImageSelect={handleImageSelect}
              previewUrl={previewUrl}
            />

            {selectedFile && !result && (
              <Button
                onClick={handleClassify}
                disabled={isClassifying}
                className="w-full"
                size="lg"
              >
                {isClassifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Classifying...
                  </>
                ) : (
                  'Classify Image'
                )}
              </Button>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right: Results Section */}
          <div>
            {result ? (
              <ClassificationResults
                topPrediction={result.top_prediction}
                topScore={result.top_score}
                predictionSet={result.prediction_set}
                predictionScores={result.prediction_scores}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center">
                  Upload an image and click classify to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Task 2.5: Update App Router
**File:** `client/src/App.tsx`
```typescript
// Replace WelcomePage import with ClassificationPage
import ClassificationPage from './pages/ClassificationPage';

// In routes, replace:
<Route path="/" element={<ClassificationPage />} />
```

---

### Phase 3: Testing & Polish

#### Task 3.1: Test Locally
```bash
# Start development server
nohup ./watch.sh > /tmp/databricks-app-watch.log 2>&1 &

# Test backend endpoint with curl
curl -X POST http://localhost:8000/api/classify \
  -F "image=@test_image.jpg"

# Open frontend in browser
open http://localhost:5173
```

#### Task 3.2: Test with Playwright
```bash
# Use Playwright MCP to:
# 1. Navigate to http://localhost:5173
# 2. Upload test image
# 3. Click classify button
# 4. Verify results display
```

#### Task 3.3: Deploy to Databricks
```bash
# Deploy app
./deploy.sh --verbose

# Monitor deployment logs
uv run python dba_logz.py <app-url> --duration 60

# Test deployed endpoint
uv run python dba_client.py /api/classify POST
```

---

## Development Workflow

### Local Development Cycle

1. **Start Development Server:**
   ```bash
   nohup ./watch.sh > /tmp/databricks-app-watch.log 2>&1 &
   ```

2. **Make Changes:**
   - Backend: Edit files in `server/`
   - Frontend: Edit files in `client/src/`
   - Hot reload happens automatically

3. **Verify Changes:**
   ```bash
   # Check logs
   tail -f /tmp/databricks-app-watch.log

   # Test backend
   curl -X POST http://localhost:8000/api/classify -F "image=@test.jpg"

   # Test frontend
   open http://localhost:5173
   ```

4. **Format Code:**
   ```bash
   ./fix.sh
   ```

5. **Deploy:**
   ```bash
   ./deploy.sh
   ```

### Error Handling Strategy

**Frontend:**
- File type validation before upload
- File size validation before upload
- Display user-friendly error messages
- Loading states during classification
- Timeout handling (5 min for cold start)

**Backend:**
- Validate file type (JPG/PNG only)
- Validate file size (10MB max)
- Handle model endpoint errors gracefully
- Return clear error messages
- Log errors for debugging

**Model Endpoint:**
- 300 second timeout (5 min for cold start)
- Retry logic not needed (single attempt)
- Clear timeout message to user

---

## Performance Considerations

### Cold Start Handling
**Problem:** Model endpoint may take 3-5 minutes to spin up

**Solutions:**
1. Set 5-minute timeout on backend request
2. Show clear loading message to user: "Model is starting up, this may take a few minutes..."
3. Consider warming endpoint before demos (make test request)

### Image Size Optimization
**Problem:** Large images slow down upload and processing

**Solutions:**
1. 10MB file size limit
2. Accept images as-is (no frontend resizing)
3. Backend sends raw bytes to model (model handles preprocessing)

### Response Time
**Expected:** < 2 seconds (hot endpoint)
**Worst Case:** 5 minutes (cold start)
**User Experience:** Progress indicator with timeout message

---

## Security Considerations

### Authentication
- **No user authentication** (requirement for demos)
- **App service principal** used for model endpoint calls
- Service principal token managed by Databricks SDK

### File Upload Security
- **File type validation:** Only JPG/PNG
- **File size limit:** 10MB max
- **No file storage:** Images discarded after classification
- **No user data collection**

### API Security
- **CORS:** Handled by Databricks Apps platform
- **Rate limiting:** Not implemented (demo use case)
- **Input validation:** File type and size only

---

## Deployment Architecture

### Build Process
```bash
./deploy.sh performs:
1. Generate requirements.txt (uv)
2. Build frontend (bun + vite)
3. Upload to Databricks workspace
4. Deploy to app
```

### Runtime Environment
- **Python Runtime:** Python 3.11+
- **Web Server:** Uvicorn (async)
- **Static Files:** Frontend served by FastAPI
- **Environment Variables:** Loaded from .env.local (local) or app config (deployed)

---

## File Structure

```
server/
  routers/
    classify.py          # NEW: Classification endpoint
  services/
    model_client.py      # NEW: Model serving client
  app.py                 # MODIFY: Register classify router

client/
  src/
    components/
      ImageUpload.tsx    # NEW: Image upload component
      ClassificationResults.tsx  # NEW: Results display
      ui/                # shadcn components (card, button, etc.)
    pages/
      ClassificationPage.tsx  # NEW: Main classification page
    App.tsx              # MODIFY: Use ClassificationPage

pyproject.toml           # MODIFY: Add httpx, python-multipart
```

---

## Testing Strategy

### Unit Tests (Optional)
- Backend: Test model client with mocked responses
- Frontend: Test components in isolation

### Integration Tests
- Upload flow: File → Backend → Model → Results
- Error handling: Invalid files, endpoint errors, timeouts

### Manual Testing
1. Upload valid JPG/PNG images
2. Upload invalid file types
3. Upload oversized files
4. Test with cold endpoint (5 min timeout)
5. Test with hot endpoint (fast response)
6. Verify confidence bars and colors
7. Test drag-and-drop
8. Test file picker

---

## Monitoring & Debugging

### Development
```bash
# Check watch logs
tail -f /tmp/databricks-app-watch.log

# Test backend directly
curl -X POST http://localhost:8000/api/classify -F "image=@test.jpg"
```

### Deployment
```bash
# Monitor deployment
uv run python dba_logz.py <app-url> --duration 60

# Check app status
./app_status.sh

# Test deployed endpoint
uv run python dba_client.py /api/classify POST
```

### Common Issues

**Issue:** Model endpoint timeout
- **Cause:** Cold start (endpoint spinning up)
- **Solution:** Wait 3-5 minutes, retry
- **Prevention:** Warm endpoint before demos

**Issue:** "Invalid file type" error
- **Cause:** Unsupported image format
- **Solution:** Use JPG or PNG only

**Issue:** Frontend not showing results
- **Cause:** TypeScript client not regenerated
- **Solution:** Run `uv run python scripts/make_fastapi_client.py`

---

## Summary

This design provides a **simple, clean, and polished** food classification app that:

✅ Uses existing Databricks Apps infrastructure
✅ Integrates with your model serving endpoint
✅ Handles cold starts gracefully (5 min timeout)
✅ Provides excellent UX with drag-and-drop, confidence bars, and colors
✅ Requires minimal new dependencies
✅ Follows best practices for error handling
✅ Is optimized for demos and presentations

**Next Step:** Implementation - ready to proceed when you are!
