"""
Seed the database with sample data for demo
"""
from app import create_app
from models import db, User, Person, Task, Settings, Caregiver
from datetime import datetime, timedelta

def seed_database():
    app = create_app()
    
    with app.app_context():
        print("🌱 Seeding database with sample data...")
        
        # Check if user already exists
        user = User.query.filter_by(id=1).first()
        
        if user:
            print("⚠️  Database already seeded. Skipping...")
            return
        
        # Create user
        user = User(
            id=1,
            email='patient@facelink.app',
            name='Patient User'
        )
        db.session.add(user)
        db.session.flush()
        
        print("✅ Created user")
        
        # Create people (without face encodings - those will be added via photo upload)
        people_data = [
            {
                'name': 'Anika',
                'relationship': 'Daughter',
                'reminder': 'Lives in Seattle. Works as a teacher. Loves gardening. Visits every weekend.'
            },
            {
                'name': 'Ravi',
                'relationship': 'Son',
                'reminder': 'Engineer at tech company. Visits every Sunday. Just got engaged to Sarah.'
            },
            {
                'name': 'Dr. Lee',
                'relationship': 'Neurologist',
                'reminder': 'Your doctor. Appointments on Tuesdays. Likes to hear about your walks.'
            },
            {
                'name': 'Margaret',
                'relationship': 'Neighbor',
                'reminder': 'Brings fresh bread on Thursdays. Has a golden retriever named Buddy.'
            }
        ]
        
        for person_data in people_data:
            person = Person(
                name=person_data['name'],
                relationship=person_data['relationship'],
                reminder=person_data['reminder'],
                user_id=user.id
            )
            db.session.add(person)
        
        print(f"✅ Created {len(people_data)} people")
        
        # Create tasks for today and tomorrow
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        
        tasks_data = [
            # Today's tasks
            {
                'title': 'Breakfast',
                'description': 'Oatmeal with berries and orange juice',
                'time': '9:00 AM',
                'date': today
            },
            {
                'title': 'Morning Walk',
                'description': 'Around the neighborhood with Margaret',
                'time': '11:30 AM',
                'date': today
            },
            {
                'title': 'Doctor Appointment',
                'description': 'Dr. Lee - Regular checkup at the clinic',
                'time': '3:00 PM',
                'date': today,
                'reminder': True
            },
            {
                'title': 'Dinner with Ravi',
                'description': 'Ravi is bringing takeout from your favorite restaurant',
                'time': '6:30 PM',
                'date': today
            },
            {
                'title': 'Evening Routine',
                'description': 'Take medications and prepare for bed',
                'time': '8:00 PM',
                'date': today
            },
            # Tomorrow's tasks
            {
                'title': 'Breakfast',
                'description': 'Scrambled eggs and toast',
                'time': '9:00 AM',
                'date': tomorrow
            },
            {
                'title': 'Video Call with Anika',
                'description': 'Weekly catch-up call',
                'time': '2:00 PM',
                'date': tomorrow,
                'reminder': True
            }
        ]
        
        for task_data in tasks_data:
            task = Task(
                title=task_data['title'],
                description=task_data.get('description', ''),
                time=task_data['time'],
                date=task_data['date'],
                reminder=task_data.get('reminder', False),
                user_id=user.id
            )
            db.session.add(task)
        
        print(f"✅ Created {len(tasks_data)} tasks")
        
        # Create settings
        settings = Settings(
            home_address='742 Maple Street, Seattle, WA 98102',
            home_label='home',
            reassurance_message='You are at home. Everything is okay. Your family loves you and will visit soon.',
            map_latitude=47.6280,
            map_longitude=-122.3270,
            user_id=user.id
        )
        db.session.add(settings)
        db.session.flush()
        
        print("✅ Created settings")
        
        # Create caregivers
        caregivers_data = [
            {
                'name': 'Anika',
                'relationship': 'Daughter',
                'phone_number': '+1-206-555-0123',
                'email': 'anika@example.com',
                'is_primary': True
            },
            {
                'name': 'Ravi',
                'relationship': 'Son',
                'phone_number': '+1-206-555-0456',
                'email': 'ravi@example.com',
                'is_primary': False
            },
            {
                'name': 'Dr. Lee',
                'relationship': 'Doctor',
                'phone_number': '+1-206-555-0789',
                'email': 'drlee@clinic.com',
                'is_primary': False
            }
        ]
        
        for caregiver_data in caregivers_data:
            caregiver = Caregiver(
                name=caregiver_data['name'],
                relationship=caregiver_data['relationship'],
                phone_number=caregiver_data['phone_number'],
                email=caregiver_data.get('email'),
                is_primary=caregiver_data.get('is_primary', False),
                settings_id=settings.id
            )
            db.session.add(caregiver)
        
        print(f"✅ Created {len(caregivers_data)} caregivers")
        
        # Commit all changes
        db.session.commit()
        
        print("\n🎉 Database seeded successfully!")
        print("\n📋 Summary:")
        print(f"   • 1 user")
        print(f"   • {len(people_data)} people (add photos via /api/people/<id>/upload-photo)")
        print(f"   • {len(tasks_data)} tasks")
        print(f"   • 1 settings with {len(caregivers_data)} caregivers")
        print("\n✨ Ready to start the backend server!")

if __name__ == '__main__':
    seed_database()
