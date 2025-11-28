try:
    import face_recognition  # type: ignore
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    face_recognition = None  # type: ignore
    FACE_RECOGNITION_AVAILABLE = False
    print("⚠️  face_recognition not installed - using mock mode for development")

import numpy as np
from typing import List, Tuple, Optional
import base64
from PIL import Image
from io import BytesIO
from config import Config

class FaceRecognitionService:
    """Service for face recognition operations"""
    
    @staticmethod
    def extract_encoding_from_bytes(image_data: bytes) -> Optional[np.ndarray]:
        """
        Extract 128-D face encoding from image bytes.
        Returns None if no face found.
        """
        try:
            if FACE_RECOGNITION_AVAILABLE:
                # Real face recognition
                image = face_recognition.load_image_file(BytesIO(image_data))
                face_locations = face_recognition.face_locations(image)
                
                if len(face_locations) == 0:
                    return None  # No face detected
                
                face_encodings = face_recognition.face_encodings(image, face_locations)
                
                if len(face_encodings) > 0:
                    return face_encodings[0]  # Return 128-D numpy array
                
                return None
            else:
                # Mock mode - generate random encoding for development
                # Validate image format first
                image = Image.open(BytesIO(image_data))
                if image.format not in ['JPEG', 'PNG', 'JPG']:
                    return None
                
                # Generate deterministic "encoding" based on image size for demo
                # This allows testing the API without face_recognition library
                np.random.seed(image.size[0] * image.size[1])
                return np.random.rand(128).astype(np.float64)
            
        except Exception as e:
            print(f"❌ Error extracting face encoding: {e}")
            return None
    
    @staticmethod
    def extract_encoding_from_base64(base64_string: str) -> Optional[np.ndarray]:
        """
        Decode base64 image and extract face encoding.
        Handles data URLs like "data:image/jpeg;base64,..."
        """
        try:
            # Remove data URL header if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64 to bytes
            image_data = base64.b64decode(base64_string)
            return FaceRecognitionService.extract_encoding_from_bytes(image_data)
            
        except Exception as e:
            print(f"❌ Error decoding base64 image: {e}")
            return None
    
    @staticmethod
    def compare_faces(unknown_encoding: np.ndarray, 
                     known_encodings: List[np.ndarray],
                     known_person_ids: List[int]) -> Tuple[Optional[int], float]:
        """
        Compare unknown face against all known faces.
        Returns (person_id, confidence) or (None, 0.0) if no match.
        
        Args:
            unknown_encoding: 128-D encoding of unknown face
            known_encodings: List of known face encodings
            known_person_ids: Corresponding person IDs
        
        Returns:
            Tuple of (matched_person_id, confidence_score)
        """
        if len(known_encodings) == 0:
            return None, 0.0
        
        try:
            if FACE_RECOGNITION_AVAILABLE:
                # Real face recognition
                face_distances = face_recognition.face_distance(known_encodings, unknown_encoding)
                best_match_index = np.argmin(face_distances)
                best_distance = face_distances[best_match_index]
                
                if best_distance < Config.FACE_DISTANCE_THRESHOLD:
                    confidence = 1.0 - best_distance
                    return known_person_ids[best_match_index], float(confidence)
                
                return None, 0.0
            else:
                # Mock mode - calculate Euclidean distance manually
                distances = []
                for encoding in known_encodings:
                    distance = np.linalg.norm(unknown_encoding - encoding)
                    distances.append(distance)
                
                best_match_index = np.argmin(distances)
                best_distance = distances[best_match_index]
                
                # Normalize distance to 0-1 range (assuming max distance ~1.0 for random vectors)
                if best_distance < Config.FACE_DISTANCE_THRESHOLD:
                    confidence = max(0.0, 1.0 - best_distance)
                    return known_person_ids[best_match_index], float(confidence)
                
                return None, 0.0
            
        except Exception as e:
            print(f"❌ Error comparing faces: {e}")
            return None, 0.0
    
    @staticmethod
    def validate_image_format(image_data: bytes) -> bool:
        """
        Validate that image data is a valid image format.
        """
        try:
            image = Image.open(BytesIO(image_data))
            # Check if it's a valid image format
            return image.format in ['JPEG', 'PNG', 'JPG']
        except Exception:
            return False
    
    @staticmethod
    def count_faces(image_data: bytes) -> int:
        """
        Count number of faces in an image.
        Useful for validation (want exactly 1 face for reference photos).
        """
        try:
            if FACE_RECOGNITION_AVAILABLE:
                image = face_recognition.load_image_file(BytesIO(image_data))
                face_locations = face_recognition.face_locations(image)
                return len(face_locations)
            else:
                # Mock mode - assume 1 face for valid images
                image = Image.open(BytesIO(image_data))
                if image.format in ['JPEG', 'PNG', 'JPG']:
                    return 1
                return 0
        except Exception as e:
            print(f"❌ Error counting faces: {e}")
            return 0
