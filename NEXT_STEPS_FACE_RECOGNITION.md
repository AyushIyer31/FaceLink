# Next Steps: Face Recognition Photo Upload Feature

## Overview
Add photo upload functionality to allow users to capture/upload photos for each person and enable real face recognition.

---

## Backend Changes

### 1. Add Photo Upload Endpoint
**File:** `/Backend/routes/people.py`

Add new endpoint after the existing routes:

```python
@people_bp.route('/<person_id>/upload-photo', methods=['POST'])
def upload_photo(person_id):
    """Upload and process a photo for face recognition"""
    try:
        if 'photo' not in request.files:
            return jsonify({'success': False, 'error': 'No photo provided'}), 400
        
        file = request.files['photo']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        person = Person.query.get(person_id)
        if not person:
            return jsonify({'success': False, 'error': 'Person not found'}), 404
        
        # Save the photo
        filename = f"{person_id}_{int(time.time())}_{secure_filename(file.filename)}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Generate face encodings
        from services.face_service import generate_face_encoding
        encoding = generate_face_encoding(filepath)
        
        if encoding is None:
            os.remove(filepath)  # Clean up
            return jsonify({'success': False, 'error': 'No face detected in photo'}), 400
        
        # Update person record
        person.photo_url = f'/uploads/{filename}'
        person.face_encoding = encoding.tobytes()  # Store as binary
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'person': person.to_dict(),
                'message': 'Photo uploaded and face encoding generated'
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
```

### 2. Add Face Encoding Generation Function
**File:** `/Backend/services/face_service.py`

Add this function:

```python
def generate_face_encoding(image_path):
    """
    Generate face encoding from an image file
    Returns: numpy array of 128 dimensions or None if no face found
    """
    try:
        # Load image
        image = face_recognition.load_image_file(image_path)
        
        # Find all face encodings in the image
        face_encodings = face_recognition.face_encodings(image)
        
        if len(face_encodings) == 0:
            return None
        
        # Return the first face encoding (assuming one person per photo)
        return face_encodings[0]
    except Exception as e:
        print(f"Error generating face encoding: {e}")
        return None
```

### 3. Update Model to Store Encodings
**File:** `/Backend/models.py`

The `Person` model already has `face_encoding` field, but ensure it's properly typed:

```python
class Person(db.Model):
    # ... existing fields ...
    face_encoding = db.Column(db.LargeBinary, nullable=True)  # 128-D vector as bytes
```

### 4. Add Static File Serving
**File:** `/Backend/app.py`

Add route to serve uploaded images:

```python
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded images"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
```

Add import at top:
```python
from flask import send_from_directory
```

### 5. Install Required Dependencies
**File:** `/Backend/requirements.txt`

Ensure these are listed (most already are):
```
Werkzeug>=3.0.0
```

---

## Frontend Changes

### 1. Add Photo Upload to API Client
**File:** `/FrontEnd/lib/api.ts`

Add new function:

```typescript
export async function uploadPersonPhoto(personId: string, photoFile: File): Promise<Person | null> {
  try {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const res = await fetch(`${API_BASE_URL}/api/people/${personId}/upload-photo`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.success ? data.data.person : null;
  } catch (error) {
    console.error('Failed to upload photo:', error);
    return null;
  }
}
```

### 2. Add Photo Upload UI Component
**File:** `/FrontEnd/components/people-list.tsx`

Add photo upload functionality to each person in the list:

```typescript
import { Camera, Upload } from "lucide-react"

// Inside PeopleList component, add state for photo upload
const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null)
const fileInputRef = useRef<HTMLInputElement>(null)

// Add function to handle photo upload
async function handlePhotoUpload(personId: string, file: File) {
  setUploadingPhotoFor(personId)
  const updatedPerson = await uploadPersonPhoto(personId, file)
  if (updatedPerson) {
    setPeople(people.map((p) => (p.id === personId ? updatedPerson : p)))
  }
  setUploadingPhotoFor(null)
}

// Add file input handler
function triggerFileInput(personId: string) {
  if (fileInputRef.current) {
    fileInputRef.current.dataset.personId = personId
    fileInputRef.current.click()
  }
}

function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  const personId = e.target.dataset.personId
  if (file && personId) {
    handlePhotoUpload(personId, file)
  }
  e.target.value = '' // Reset input
}
```

Add to the JSX for each person (in the non-editing view):

```tsx
{/* Add hidden file input */}
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileChange}
/>

{/* Add photo display and upload button */}
<div className="flex items-start justify-between gap-2">
  <div className="flex gap-3 flex-1">
    {/* Photo preview */}
    {person.photo_url ? (
      <img 
        src={`http://localhost:3001${person.photo_url}`} 
        alt={person.name}
        className="w-16 h-16 rounded-full object-cover"
      />
    ) : (
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <span className="text-2xl">👤</span>
      </div>
    )}
    
    <div className="flex-1">
      <p className="text-xl font-semibold">{person.name}</p>
      <p className="text-lg text-muted-foreground">{person.relationship}</p>
      {person.reminder && (
        <p className="text-sm text-muted-foreground mt-1 italic">{person.reminder}</p>
      )}
    </div>
  </div>
  
  <div className="flex gap-1">
    {/* Upload photo button */}
    <Button
      onClick={() => triggerFileInput(person.id)}
      size="sm"
      variant="ghost"
      disabled={uploadingPhotoFor === person.id || editingId !== null || isAdding}
      title="Upload photo"
    >
      {uploadingPhotoFor === person.id ? (
        <span className="animate-spin">⏳</span>
      ) : (
        <Upload className="h-4 w-4" />
      )}
      <span className="sr-only">Upload photo for {person.name}</span>
    </Button>
    
    {/* Existing edit and delete buttons */}
    <Button onClick={() => startEdit(person)} ...>
      ...
    </Button>
  </div>
</div>
```

### 3. Add Camera Capture Option (Optional Enhancement)
**File:** `/FrontEnd/components/photo-capture-dialog.tsx` (NEW FILE)

Create a reusable dialog component for capturing photos:

```typescript
"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"

interface PhotoCaptureDialogProps {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
  personName: string
}

export function PhotoCaptureDialog({ 
  open, 
  onClose, 
  onCapture,
  personName 
}: PhotoCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)

  useEffect(() => {
    if (open && !stream) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [open])

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Camera access failed:", err)
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCaptured(imageData)
  }

  function handleUsePhoto() {
    if (!captured) return
    
    // Convert base64 to File
    fetch(captured)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${personName}-photo.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        handleClose()
      })
  }

  function handleClose() {
    stopCamera()
    setCaptured(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">
          Capture Photo for {personName}
        </h2>
        
        <div className="space-y-4">
          {!captured ? (
            <>
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={capturePhoto} size="lg" className="flex-1">
                  <Camera className="mr-2" />
                  Capture Photo
                </Button>
                <Button onClick={handleClose} variant="outline" size="lg">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img src={captured} alt="Captured" className="w-full" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUsePhoto} size="lg" className="flex-1">
                  Use This Photo
                </Button>
                <Button onClick={() => setCaptured(null)} variant="outline" size="lg">
                  Retake
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

Then update `people-list.tsx` to include camera capture option:

```typescript
import { PhotoCaptureDialog } from "@/components/photo-capture-dialog"

// Add state
const [showCameraFor, setShowCameraFor] = useState<string | null>(null)

// Add button next to Upload button
<Button
  onClick={() => setShowCameraFor(person.id)}
  size="sm"
  variant="ghost"
  disabled={uploadingPhotoFor === person.id || editingId !== null || isAdding}
  title="Take photo"
>
  <Camera className="h-4 w-4" />
</Button>

// Add dialog at end of component
{showCameraFor && (
  <PhotoCaptureDialog
    open={true}
    onClose={() => setShowCameraFor(null)}
    onCapture={(file) => {
      handlePhotoUpload(showCameraFor, file)
      setShowCameraFor(null)
    }}
    personName={people.find(p => p.id === showCameraFor)?.name || ''}
  />
)}
```

---

## Testing Steps

### 1. Backend Testing
```bash
# Test photo upload
curl -X POST http://localhost:3001/api/people/1/upload-photo \
  -F "photo=@/path/to/test-photo.jpg"

# Verify response contains photo_url and face encoding generated
```

### 2. Frontend Testing
1. Start both servers:
   - Backend: `cd Backend && python app.py`
   - Frontend: `cd FrontEnd && npm run dev`

2. Open `http://localhost:3000`
3. Click the Upload icon next to a person
4. Select a photo with a clear face
5. Verify photo appears in the person's card
6. Test camera capture option if implemented
7. Test face recognition with the uploaded photo

### 3. Face Recognition Testing
1. Upload multiple photos for different people
2. Enable Visitor Mode
3. Hold the uploaded photo up to the camera
4. Verify the system recognizes the person correctly
5. Check that TTS announces the person's name

---

## Installation Requirements

### For Real Face Recognition (Not Mock Mode)

You'll need to install `face_recognition` library, which requires:

```bash
# On macOS (requires Homebrew)
brew install cmake
pip install face_recognition

# On Ubuntu/Debian
sudo apt-get install cmake python3-dev
pip install face_recognition

# On Windows
# Download CMake from https://cmake.org/download/
pip install face_recognition
```

**Note:** If you can't install face_recognition, the mock mode will continue to work for testing the upload UI, but actual face recognition won't function.

---

## Future Enhancements

1. **Multiple Face Training**: Allow uploading multiple photos per person for better recognition accuracy
2. **Confidence Threshold UI**: Let users adjust recognition confidence in settings
3. **Photo Gallery**: View all uploaded photos for a person
4. **Bulk Upload**: Upload multiple photos at once
5. **Face Detection Preview**: Show face bounding boxes before saving
6. **Photo Editing**: Crop/rotate photos before upload
7. **Progressive Web App**: Install app on mobile devices for easier photo capture

---

## Files to Create/Modify

### Backend
- ✏️ `/Backend/routes/people.py` - Add upload endpoint
- ✏️ `/Backend/services/face_service.py` - Add encoding function
- ✏️ `/Backend/app.py` - Add static file serving
- ✏️ `/Backend/models.py` - Verify face_encoding field
- 📁 Ensure `/Backend/uploads/` directory exists and is writable

### Frontend
- ✏️ `/FrontEnd/lib/api.ts` - Add uploadPersonPhoto function
- ✏️ `/FrontEnd/components/people-list.tsx` - Add photo upload UI
- 🆕 `/FrontEnd/components/photo-capture-dialog.tsx` - (Optional) Camera capture component

---

## Estimated Time
- Backend implementation: 2-3 hours
- Frontend implementation: 3-4 hours
- Testing and refinement: 2 hours
- **Total: 7-9 hours**
