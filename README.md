# UniCat — CS50W Final Project

UniCat is a Django-based web platform to connect university students across Catalonia.  
It provides a place to **share academic resources**, **discover/post university events**, and **connect Erasmus students** going to the same universities.  
The backend is built with **Django + Django REST Framework**, and the frontend uses templates with Bootstrap and JavaScript for a responsive UI.

---

## ✨ Key Features

- **Resources**: upload, manage, and share academic files with metadata  
- **Events**: create, list, and view events with date, location, and validation  
- **Erasmus**: search & connect by country and university, with dynamic filtering in the UI  
- **Auth & Profiles**: registration/login with university selection  
- **Admin**: manage models via Django Admin  
- **REST API**: endpoints provided with Django REST Framework for extensibility  

---

## 🗂️ Project Structure

```text
UNICAT_/
├─ finalproject/
├─ jsons/                     # Datasets/config JSON if any
├─ unicat/                    # Django project (apps, templates, static, admin, etc.)
│   ├─ templates/             # HTML templates (layout, home, resources, events, erasmus…)
│   ├─ static/                # CSS/JS assets
│   └─ management/commands/   # import_countries (Erasmus module)
├─ .gitignore
├─ [manage.py](http://_vscodecontentref_/0)
├─ [requirements.txt](http://_vscodecontentref_/1)
└─ [README.md](http://_vscodecontentref_/2)
```
🧰 Tech Stack
Backend: Django, Django REST Framework
Frontend: HTML templates, JavaScript, Bootstrap
Database: PostgreSQL (via psycopg2), SQLite for dev
Static & Media: WhiteNoise (local), AWS S3 (via boto3 + django-storages)
Config: python-decouple for environment variables
Deployment: Gunicorn + production server (e.g., Heroku, Render, or AWS)
🚀 Getting Started (Local)
1) Clone & Setup
2) Environment Variables
Create a .env file in the project root with:

Use python-decouple to load these values in settings.py.

3) Database Migrations
4) Import Erasmus Countries
5) Run Development Server
Visit → http://127.0.0.1:8000/

🧭 Main Screens
Dashboard: home for authenticated users
Resources: list, upload, detail, comments
Events: list, detail, create/edit form
Erasmus: search/filter by country & university; register form
Auth: login/register with university selection
📦 Dependencies
Install all dependencies with:

Key packages:

django — web framework
djangorestframework — REST API support
Pillow — image/file handling
gunicorn — production WSGI server
psycopg2-binary — PostgreSQL driver
python-decouple — environment variable management
whitenoise — static file serving
boto3, django-storages — AWS S3 storage integration
🛡️ Deployment Notes
Set DEBUG=False and configure ALLOWED_HOSTS in production
Use PostgreSQL instead of SQLite for production
Store static & media files on AWS S3 (configured via django-storages)
Run with gunicorn behind Nginx or on a platform like Heroku/Render
📜 License
This project currently has no explicit license. Add a LICENSE file if you want to open-source it (e.g., MIT).

👤 Author
Built by tinips as part of the CS50W final project.
Feedback and contributions are welcome!
