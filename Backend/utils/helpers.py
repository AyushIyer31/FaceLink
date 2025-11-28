import os
import base64
from werkzeug.utils import secure_filename
from config import Config
from datetime import datetime

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def save_base64_image(base64_string, person_id):
    """
    Save base64 encoded image to disk.
    Returns the relative URL path to the saved image.
    """
    try:
        # Remove data URL header if present
        if ',' in base64_string:
            header, base64_string = base64_string.split(',', 1)
            # Extract image format from header (e.g., "data:image/jpeg;base64")
            if 'image/' in header:
                image_format = header.split('image/')[1].split(';')[0]
            else:
                image_format = 'jpeg'
        else:
            image_format = 'jpeg'
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Create filename
        filename = f"person_{person_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{image_format}"
        filename = secure_filename(filename)
        
        # Save to uploads/people/
        filepath = os.path.join(Config.UPLOAD_FOLDER, 'people', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        # Return relative URL
        return f"/uploads/people/{filename}"
        
    except Exception as e:
        print(f"❌ Error saving image: {e}")
        return None

def delete_image(photo_url):
    """Delete image file from disk"""
    try:
        if photo_url and photo_url.startswith('/uploads/'):
            # Remove leading slash
            filepath = photo_url.lstrip('/')
            full_path = os.path.join(os.getcwd(), filepath)
            
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
    except Exception as e:
        print(f"❌ Error deleting image: {e}")
    return False

def format_response(success=True, data=None, message=None, error=None):
    """Standard API response format"""
    response = {'success': success}
    
    if data is not None:
        response['data'] = data
    
    if message:
        response['message'] = message
    
    if error:
        response['error'] = error
    
    return response
