# UniCat — a platform where university students connect

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
## 🧰 Tech Stack

- **Backend**: Django, Django REST Framework  
- **Frontend**: HTML templates, JavaScript, Bootstrap  
- **Database**: PostgreSQL (via psycopg2), SQLite for dev  
- **Static & Media**: WhiteNoise (local), AWS S3 (via boto3 + django-storages)  
- **Config**: python-decouple for environment variables  
- **Deployment**: Gunicorn + production server (e.g., Heroku, Render, or AWS)

---
## 🧭 Main Screens

- **Dashboard**: home for authenticated users  
- **Resources**: list, upload, detail, comments  
- **Events**: list, detail, create/edit form  
- **Erasmus**: search/filter by country & university; connect form  
- **Auth**: login/register with university selection  

---
## 🌐 Live Demo

You can visit the live app and create an account here:  
👉 [http://unicat-app.ddns.net/](http://unicat-app.ddns.net/)

---

## 🔗 More Information

I wrote 3 detailed posts on LinkedIn explaining the project:  
👉 [My LinkedIn Profile](https://www.linkedin.com/in/albertárboles)

## 👤 Author

Built by **Albert Árboles**  
Feedback and contributions are welcome!

