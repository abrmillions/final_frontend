#!/bin/bash

# Construction License Management System - Django Setup Script

echo "==================================================="
echo "Django Backend Setup"
echo "==================================================="

# Navigate to backend directory
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser prompt
echo ""
echo "==================================================="
echo "Create Django Superuser (Admin)"
echo "==================================================="
echo "You will now create an admin account for the Django admin panel."
python manage.py createsuperuser

# Start Django server
echo ""
echo "==================================================="
echo "Starting Django Development Server"
echo "==================================================="
echo "Django will start on http://localhost:8000"
echo "Admin panel: http://localhost:8000/admin"
echo ""

python manage.py runserver 0.0.0.0:8000
