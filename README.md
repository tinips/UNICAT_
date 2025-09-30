# README.md for CS50W Final Project: UniCat

## Overview

UniCat is a web platform designed to connect students from universities across Catalonia. The application provides a collaborative space where students can share academic resources, post and discover university events, and connect with other students participating in Erasmus exchange programs at the same universities.

The platform is built using Django for the backend and JavaScript for frontend interactivity, incorporating a fully responsive design to ensure an optimal experience on both mobile and desktop devices.

## Distinctiveness and Complexity

This project significantly distinguishes itself from other course projects for the following reasons:

### Focus and Purpose

Unlike traditional social networks (Project 4) or e-commerce platforms (Project 2), UniCat is a specialized application targeted at a specific niche: university students in Catalonia. Its focus is not general social interaction or shopping, but rather facilitating academic and cultural collaboration among students.

### Motivation

I chose this particular topic to consolidate multiple existing platforms into a single, cohesive web application. Currently, students often rely on various separate resources, such as university-specific websites for materials, social media for events, and fragmented online communities for Erasmus exchange connections. Additionally, as I am planning to participate in an Erasmus exchange next year, creating a dedicated Erasmus feature seemed particularly beneficial and practical.

### Unique Functionalities

The Erasmus section is entirely original and addresses a real-world issue: connecting students who will participate in exchanges at the same universities, featuring a dynamic search and filtering system allowing users to find specific connections by country and university.

### Technical Complexity

* **Multi-model relationship system:** The app features complex relational models among users, resources, Erasmus programs, participants, events, and comments.
* **Dynamic filtering with JavaScript:** Real-time filtering functionality for Erasmus programs enables users to find exchanges by country and university without page reloads.
* **File and content management:** The resources module allows users to upload, manage, and share academic files along with associated metadata.
* **Event system with date and location management:** The events calendar includes robust validation for dates and location management.
* **Conditional forms:** Erasmus registration forms dynamically adapt, displaying different fields based on context when accessed through direct links to existing programs.

### Technology Integration

The project cohesively integrates multiple technologies:

* Django for backend and model management
* JavaScript for real-time interactivity
* Bootstrap for responsive design
* Template inheritance system for consistent user experience

## File Structure and Content

### Backend (Django)

* **models.py**: Defines data models for Users, Resources, Events, Erasmus Programs, Erasmus Participants, Countries, and Comments.
* **views.py**: Contains backend logic for authentication, resource management, event handling, Erasmus program and participant management, comments, and shared functionalities.
* **urls.py**: Maps URLs to specific views.
* **admin.py**: Configures the admin panel to manage models.
* **management/commands/countries.csv**: CSV file containing all world countries for the Erasmus module.
* **management/commands/import_countries.py**: Custom Django command to import world countries from CSV file for use in the Erasmus country selection fields.

### Media Files

* **media/resources/**: Directory where uploaded academic resources are stored.   

### Frontend

* **templates/unicat/layout.html**: Base template with common structure, navigation and shared header.
* **templates/unicat/index.html**: Welcome page for unauthenticated users with presentation of main features.
* **templates/unicat/home.html**: Main dashboard for authenticated users with access to all functionalities.
* **templates/unicat/login.html**: Authentication form with field validation.
* **templates/unicat/register.html**: Registration form with validation, including university selection.
* **templates/unicat/resources.html**: Interface to share and discover academic resources with category filtering.
* **templates/unicat/resource_detail.html**: Detailed view of a specific resource with download options and comments.
* **templates/unicat/events.html**: Page for listing and managing university events.
* **templates/unicat/event_detail.html**: Detailed information about an event with location, date, duration and participants.
* **templates/unicat/event_form.html**: Form used for creating new events or editing existing ones depending on context.
* **templates/unicat/erasmus.html**: Interface to search and connect with exchange students, with filters by country and university.
* **templates/unicat/erasmus_form.html**: Form to register or create for Erasmus programs with dynamic fields based on context.
* **templates/unicat/erasmus_detail.html**: Detailed view of an Erasmus program with participants information.
* **static/unicat/styles.css**: Custom styles for the application.
* **static/unicat/resources.js**: JavaScript functionalities for dynamic filtering, form management and interface improvements.

## Running the Application

Ensure you have Python 3.8 or higher installed.

1. Clone the repository:

```bash
git clone <repository-url>
```

2. Perform database migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

3. Run the development server:

```bash
python manage.py runserver
```
4. Import countries data to Erasmus module:

```bash
python manage.py import_countries
```

5. Open a browser and navigate to:

```
http://127.0.0.1:8000
```

## Additional Information

### Main Features

* **Authentication:** Registration and login with university selection.
* **Resources:** Share, search, and download academic materials.
* **Events:** Post and discover university activities.
* **Erasmus:** Connect with students attending the same exchange university.
