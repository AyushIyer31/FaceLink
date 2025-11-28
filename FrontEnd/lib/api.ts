// API client for FaceLink backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types matching backend responses
export interface Person {
  id: string;
  name: string;
  relationship: string;
  reminder: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  time: string;
  date: string;
  completed: boolean;
  reminder: boolean;
}

export interface Caregiver {
  id: string;
  name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  is_primary: boolean;
}

export interface Settings {
  id: string;
  home_address: string;
  home_label?: string;
  reassurance_message: string;
  map_latitude?: number;
  map_longitude?: number;
  caregivers: Caregiver[];
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  timestamp: string;
  person_name?: string;
  person_relationship?: string;
  notes?: string;
  confidence?: number;
}

export interface RecognitionResult {
  recognized: boolean;
  person?: Person;
  confidence?: number;
  should_announce: boolean;
  message: string;
}

// API Functions

export async function fetchPeople(): Promise<Person[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/people`);
    const data = await res.json();
    return data.success ? data.data.people : [];
  } catch (error) {
    console.error('Failed to fetch people:', error);
    return [];
  }
}

export async function createPerson(person: Omit<Person, 'id'>): Promise<Person | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/people`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person),
    });
    const data = await res.json();
    return data.success ? data.data.person : null;
  } catch (error) {
    console.error('Failed to create person:', error);
    return null;
  }
}

export async function updatePerson(id: string, updates: Partial<Person>): Promise<Person | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/people/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.success ? data.data.person : null;
  } catch (error) {
    console.error('Failed to update person:', error);
    return null;
  }
}

export async function deletePerson(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/people/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error('Failed to delete person:', error);
    return false;
  }
}

export async function fetchTasks(date?: string): Promise<Task[]> {
  try {
    const url = date 
      ? `${API_BASE_URL}/api/tasks?date=${date}` 
      : `${API_BASE_URL}/api/tasks`;
    const res = await fetch(url);
    const data = await res.json();
    return data.success ? data.data.tasks : [];
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return [];
  }
}

export async function fetchSettings(): Promise<Settings | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings`);
    const data = await res.json();
    return data.success ? data.data.settings : null;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return null;
  }
}

export async function fetchTimeline(date?: string): Promise<TimelineEvent[]> {
  try {
    const url = date 
      ? `${API_BASE_URL}/api/timeline?date=${date}` 
      : `${API_BASE_URL}/api/timeline/today`;
    const res = await fetch(url);
    const data = await res.json();
    return data.success ? data.data.events : [];
  } catch (error) {
    console.error('Failed to fetch timeline:', error);
    return [];
  }
}

export async function triggerHelp(): Promise<{ message: string; caregivers: Caregiver[] } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/help`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data.success) {
      return {
        message: data.data.reassurance_message,
        caregivers: data.data.caregivers,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to trigger help:', error);
    return null;
  }
}

export async function recognizeFace(imageBase64: string): Promise<RecognitionResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to recognize face:', error);
    return null;
  }
}

// Helper to capture frame from video element as base64
export function captureVideoFrame(video: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Failed to capture video frame:', error);
    return null;
  }
}

// Text-to-Speech helper
export function announcePersonWithTTS(person: Person): void {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const text = `This is ${person.name}, your ${person.relationship}. ${person.reminder}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  }
}
