from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils import timezone
from datetime import datetime,timedelta

# ✅ Afegir aquest import que falta
from django.contrib import messages

from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination

from .serializers import *
from .models import *

# ✅ Imports per verificació d'email
import re
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

def index(request):
    logout(request)
    return render(request, "unicat/index.html")

@login_required
def home(request):
    resource_count = Resource.objects.count()
    events_count = Event.objects.count()
    return render(request, "unicat/home.html", {
        "username": request.user.username,
        "user_count": User.objects.count(),
        "university_count": len(University.choices) - 1,
        "connection_count": ErasmusParticipant.objects.count(),
        "resource_count": resource_count,
        "events_count": events_count
    })

def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if not user.is_email_verified:
                return render(request, "unicat/login.html", {
                    "show_toast": True,
                    "toast_message": "Please verify your email before logging in.",
                    "toast_type": "error",
                    "username": username,
                    "password": password  
                })
            
            login(request, user)
            return redirect(f'{reverse("home")}?action=login&status=success')
        else:
            try:
                user_exists = User.objects.get(username=username)
                
                if not user_exists.is_email_verified:
                    return render(request, "unicat/login.html", {
                        "show_toast": True,
                        "toast_message": "Please verify your email before logging in.",
                        "toast_type": "error",
                        "username": username,
                        "password": password 
                    })
                else:
                    return render(request, "unicat/login.html", {
                        "show_toast": True,
                        "toast_message": "Invalid username and/or password.",
                        "toast_type": "error",
                        "username": username,
                        "password": password
                    })
            except User.DoesNotExist:
                return render(request, "unicat/login.html", {
                    "show_toast": True,
                    "toast_message": "Invalid username and/or password.",
                    "toast_type": "error",
                    "username": username,
                    "password": password 
                })
    else:
        return render(request, "unicat/login.html")

def logout_view(request):
    logout(request)
    return redirect(f'{reverse("index")}?action=logout&status=success')

def validate_password_strength(password):
    """Validació personalitzada de contrasenya"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter.")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter.")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one number.")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>).")
    
    return errors

def register(request):
    if request.method == "POST":
        username = request.POST.get("username", "")
        email = request.POST.get("email", "")
        university = request.POST.get("university", "")
        firstname = request.POST.get("firstname", "")
        lastname = request.POST.get("lastname", "")
        confirmation = request.POST.get("confirmation", "")
        password = request.POST.get("password", "")
        
        # Validar que tots els camps requerits existeixen
        if not all([username, email, firstname, lastname, password, confirmation]):
            return render(request, "unicat/register.html", {
                "universities": University.choices,
                "firstname": firstname,
                "lastname": lastname,
                "username": username,
                "email": email,
                "university": university,
                "show_toast": True,
                "toast_message": "Please fill all required fields.",
                "toast_type": "error"
            })
        
        # Validació de contrasenya personalitzada
        password_errors = validate_password_strength(password)
        if password_errors:
            return render(request, "unicat/register.html", {
                "universities": University.choices,
                "firstname": firstname,
                "lastname": lastname,
                "username": username,
                "email": email,
                "university": university,
                "show_toast": True,
                "toast_message": " ".join(password_errors),
                "toast_type": "error"
            })
        
        # Check if username or email is already taken
        if User.objects.filter(username=username).exists():
            return render(request, "unicat/register.html", {
                "universities": University.choices,
                "email": email,
                "university": university,
                "firstname": firstname,
                "lastname": lastname,
                "username": username,
                "show_toast": True,
                "toast_message": "Username already taken.",
                "toast_type": "error"
            })
            
        if User.objects.filter(email=email).exists():
            return render(request, "unicat/register.html", {
                "universities": University.choices,
                "username": username,
                "firstname": firstname,
                "lastname": lastname,
                "university": university,
                "show_toast": True,
                "toast_message": "Email already registered. Please sign in.",
                "toast_type": "error"
            })
            
        # Ensure password matches confirmation
        if password != confirmation:
            return render(request, "unicat/register.html", {
                "universities": University.choices,
                "username": username,
                "email": email,
                "university": university,
                "firstname": firstname,
                "lastname": lastname,
                "show_toast": True,
                "toast_message": "Passwords must match.",
                "toast_type": "error"
            })

        # Validació adicional amb Django's built-in validators
        try:
            validate_password(password)
        except ValidationError as e:
            return render(request, "unicat/register.html", {
                "universities": University.choices,
                "username": username,
                "email": email,
                "university": university,
                "firstname": firstname,
                "lastname": lastname,
                "show_toast": True,
                "toast_message": " ".join(e.messages),
                "toast_type": "error"
            })

        # Crear usuari inactiu amb verificació d'email
        try:
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password,
                is_active=False,
                is_email_verified=False
            )
            user.university = university
            user.first_name = firstname
            user.last_name = lastname
            user.save()

            # Crear token de verificació
            token, created = EmailVerificationToken.objects.get_or_create(user=user)

            # Enviar email de verificació
            verification_link = request.build_absolute_uri(
                reverse('verify_email', args=[token.token])
            )
            
            subject = 'Verify your UniCat account'
            message = f'''
Welcome to UniCat!

Please click the link below to verify your email address:
{verification_link}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.
            '''
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                return redirect('register_success')
            except Exception as e:
                user.delete()
                return render(request, "unicat/register.html", {
                    "universities": University.choices,
                    "show_toast": True,
                    "toast_message": "Error sending verification email. Please try again.",
                    "toast_type": "error"
                })
                
        except IntegrityError:
            return render(request, "unicat/register.html", {
                "universities": University.choices,
                "username": username,
                "email": email,
                "university": university,
                "firstname": firstname,
                "lastname": lastname,
                "show_toast": True,
                "toast_message": "An error occurred. Please try again.",
                "toast_type": "error"
            })
    else:
        return render(request, "unicat/register.html", {
            "universities": University.choices
        })

# Funcions de verificació d'email
def verify_email(request, token):
    try:
        verification_token = EmailVerificationToken.objects.get(token=token)
        
        if verification_token.is_expired():
            verification_token.user.delete()
            verification_token.delete()
            return render(request, 'unicat/verification_expired.html')
        
        # Activar usuari
        user = verification_token.user
        user.is_active = True
        user.is_email_verified = True
        
        if user.email in settings.AUTHORIZED_EVENT_CREATOR_EMAILS:
            user.is_institution = True
            print(f"User {user.email} granted event creation permissions")  # Debug
        
        user.save()
        
        # Eliminar token
        verification_token.delete()
        
        # Login automàtic
        login(request, user)
        return redirect(f'{reverse("home")}?action=verify&status=success')
        
    except EmailVerificationToken.DoesNotExist:
        return render(request, 'unicat/verification_error.html')

def register_success(request):
    return render(request, 'unicat/register_success.html')

def resend_verification(request):
    if request.method == 'POST':
        email = request.POST.get('email')

        try:
            user = User.objects.get(email=email, is_active=False)
            token, created = EmailVerificationToken.objects.get_or_create(user=user)
            
            verification_link = request.build_absolute_uri(
                reverse('verify_email', args=[token.token])
            )
            
            subject = 'Verify your UniCat account'
            message = f'''
Welcome to UniCat!

Please click the link below to verify your email address:
{verification_link}

This link will expire in 24 hours.
            '''
            
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            
            return render(request, 'unicat/resend_success.html')
        except User.DoesNotExist:
            return render(request, 'unicat/resend_verification.html', {
                'show_toast': True,
                'toast_message': 'Email not found or already verified.',
                'toast_type': 'error',
                'email': email  # Mantenir l'email al formulari
            })
    
    return render(request, 'unicat/resend_verification.html')

# Resta de funcions existents...
@api_view(['GET'])
def get_events(request):
    paginator = PageNumberPagination()
    paginator.page_size = 9

    filter_university = request.GET.get('university', '')
    filter_type = request.GET.get('type', '')
    filter_month = request.GET.get('month', '')
    filter_year = request.GET.get('year', '')
    filter_interested = request.GET.get('interested', '')

    events = Event.objects.all().order_by('date')
    current_datetime = timezone.now()
    events = events.filter(date__gte=current_datetime)

    if filter_university:
        events = events.filter(university=filter_university)

    if filter_type:
        events = events.filter(type=filter_type)

    if filter_month:
        events = events.filter(date__month=int(filter_month))

    if filter_year:
        events = events.filter(date__year=int(filter_year))

    # Filter by interested events
    if filter_interested == "1" and request.user.is_authenticated:
        interested_event_ids = EventParticipant.objects.filter(
            user=request.user
        ).values_list('event_id', flat=True)
        events = events.filter(id__in=interested_event_ids)

    results = paginator.paginate_queryset(events, request)

    # Get user's participation status for all events
    user_participating_events = set()
    if request.user.is_authenticated:
        user_participating_events = set(EventParticipant.objects.filter(
            user=request.user,
            event__in=results
        ).values_list('event_id', flat=True))
    
    serializer = EventSerializer(results, many=True, context={
        'user_participating_events': user_participating_events,
        'request': request
    })
    response = paginator.get_paginated_response(serializer.data)
    response.data['current_user'] = request.user.username
    response.data['is_institution'] = getattr(request.user, 'is_institution', False)
    
    return response

@login_required
def events(request):
    years = Event.objects.dates('date', 'year').values_list('date__year', flat=True)
    years = sorted(set(years))
    has_permissions = request.user.is_institution
    return render(request, "unicat/events.html", {
        "universities": University.choices,
        "event_types": Event.types,
        "username": request.user,
        "years": years,
        "has_permissions": has_permissions
    })

@login_required
def create_event(request):
    if request.method == "POST":
        if not request.user.is_institution:
            years = Event.objects.dates('date', 'year').values_list('date__year', flat=True)
            years = sorted(set(years)) 
            return render(request, "unicat/events.html", {
                "universities": University.choices,
                "event_types": Event.types,
                "username": request.user,
                "years": years,
                "show_toast": True,
                "toast_message": "You do not have permission to create events.",
                "toast_type": "error"
            })
        
        event_name = request.POST.get("title")
        event_date = request.POST.get("date")
        event_time = request.POST.get("time")
        event_description = request.POST.get("description")
        event_location = request.POST.get("location")
        event_university = request.POST.get("university")
        event_faculty = request.POST.get("faculty")
        event_duration = request.POST.get("duration")
        event_type = request.POST.get("type")
        event_image = request.FILES.get("image")
        event_program = request.FILES.get("program_file")  
        event_inscription_link = request.POST.get("inscription_url", "")
        
        if not all([event_name, event_date, event_time, event_description, event_location, event_duration, event_type]):
            return render(request, "unicat/event_form.html", {
                "username": request.user.username,
                "universities": University.choices,
                "event_types": Event.types,
                "form": {
                    "title": event_name,
                    "description": event_description,
                    "date": event_date,
                    "time": event_time,
                    "location": event_location,
                    "university": event_university,
                    "faculty": event_faculty,
                    "duration": event_duration,
                    "type": event_type,
                    "inscription_url": event_inscription_link
                },
                "show_toast": True,
                "toast_message": "Please fill all required fields.",
                "toast_type": "error",
                "mode": "create"
            })
        
        try:
            datetime_str = f"{event_date}T{event_time}"
            combined_datetime = datetime.fromisoformat(datetime_str)
            
            if timezone.is_naive(combined_datetime):
                combined_datetime = timezone.make_aware(combined_datetime, timezone.get_current_timezone())
            
            if combined_datetime <= timezone.now():
                return render(request, "unicat/event_form.html", {
                    "username": request.user.username,
                    "universities": University.choices,
                    "event_types": Event.types,
                    "form": {
                        "title": event_name,
                        "description": event_description,
                        "date": event_date,
                        "time": event_time,
                        "location": event_location,
                        "university": event_university,
                        "faculty": event_faculty,
                        "duration": event_duration,
                        "type": event_type,
                        "inscription_url": event_inscription_link
                    },
                    "show_toast": True,
                    "toast_message": "Event date and time must be in the future.",
                    "toast_type": "error",
                    "mode": "create"
                })
            
            event = Event(
                title=event_name,
                date=combined_datetime,
                duration=event_duration,
                description=event_description,
                location=event_location,
                created_by=request.user,
                type=event_type,
                university=event_university
            )
            
            if event_faculty:
                event.faculty = event_faculty
            if event_inscription_link:
                event.inscription_link = event_inscription_link
            
            if event_image:
                event.image = event_image
            
            if event_program:
                event.program_file = event_program
            
            event.full_clean()
            request.user.events_count += 1
            event.save()
            request.user.save()

            base_url = reverse('events')
            return redirect(f'{base_url}?action=create&status=success')
            
        except Exception as e:
            return render(request, "unicat/event_form.html", {
                "username": request.user.username,
                "universities": University.choices,
                "event_types": Event.types,
                "form": {
                    "title": event_name,
                    "description": event_description,
                    "date": event_date,
                    "time": event_time,
                    "location": event_location,
                    "university": event_university,
                    "faculty": event_faculty,
                    "duration": event_duration,
                    "type": event_type,
                    "inscription_url": event_inscription_link
                },
                "show_toast": True,
                "toast_message": f"Error creating event: {e}",
                "toast_type": "error",
                "mode": "create"
            })
    
    has_permissions = request.user.is_institution
    if not has_permissions:
        years = Event.objects.dates('date', 'year').values_list('date__year', flat=True)
        years = sorted(set(years)) 
        return render(request, "unicat/events.html", {
            "universities": University.choices,
            "event_types": Event.types,
            "username": request.user,
            "years": years,
            "show_toast": True,
            "toast_message": "You do not have permission to create events.",
            "toast_type": "error"
        })
    return render(request, "unicat/event_form.html", {
        "username": request.user.username,
        "universities": University.choices,
        "event_types": Event.types,
        "mode": "create"
    })

@login_required
def delete_event(request, event_id):
    try:
        event = Event.objects.get(id=event_id)
        
        # Check if user is authorized to delete this event
        if request.user != event.created_by and not request.user.is_staff:
            base_url = reverse('events')
            return redirect(f'{base_url}?action=delete&status=error')
        
        # Check if confirmation was given
        if request.GET.get('confirmed') == 'true':
            if event.image:
                try:
                    # Delete the physical file from media folder
                    event.image.delete(save=False)
                    print(f"Deleted image for event: {event.title}")
                except Exception as e:
                    print(f"Error deleting image for event {event.title}: {e}")

            event.delete()
            request.user.events_count -= 1
            request.user.save()
            base_url = reverse('events')
            return redirect(f'{base_url}?action=delete&status=success')
        
    except Event.DoesNotExist:
        base_url = reverse('events')
        return redirect(f'{base_url}?action=delete&status=error')
        
    return redirect('events')
@login_required
def edit_event(request, event_id):
    try:
        event = Event.objects.get(id=event_id)
        # Check if user is the creator of the event
        if request.user == event.created_by:
            if request.method == "POST":
                # Get form data
                event.title = request.POST.get("event_name")
                event.description = request.POST.get("event_description")
                event.location = request.POST.get("event_location")
                event.university = request.POST.get("event_university")
                event.faculty = request.POST.get("event_faculty")
                event.duration = request.POST.get("event_duration")
                event.type = request.POST.get("event_type")
                event.inscription_link = request.POST.get("inscription_url")

                # Handle image upload
                if 'event_image' in request.FILES:
                    # If there was a previous image, delete it
                    if event.image:
                        event.image.delete(save=False)
                    # Save the new image
                    event.image = request.FILES['event_image']
                elif request.POST.get('remove_image') and event.image:
                    # If the user checked "remove image" and there's an existing image
                    event.image.delete(save=False)
                    event.image = None

                if 'event_program' in request.FILES:
                    # If there was a previous program file, delete it
                    if event.program_file:
                        event.program_file.delete(save=False)
                    # Save the new program file
                    event.program_file = request.FILES['event_program']
                elif request.POST.get('remove_program') and event.program_file:
                    # If the user checked "remove program" and there's an existing file
                    event.program_file.delete(save=False)
                    event.program_file = None
                
                # Handle date and time
                try:
                    event_date = request.POST.get("event_date")
                    new_datetime = datetime.fromisoformat(event_date)
                    
                    if timezone.is_naive(new_datetime):
                        new_datetime = timezone.make_aware(new_datetime, timezone.get_current_timezone())

                    # Now we can safely compare with timezone.now()
                    if new_datetime <= timezone.now():
                        return render(request, "unicat/event_form.html", {
                            "username": request.user.username,
                            "event": event,
                            "event_types": Event.types, 
                            "universities": University.choices,
                            "show_toast": True,
                            "toast_message": "Event date and time must be in the future.",
                            "toast_type": "error",
                            "mode": "edit"
                        })
                    
                    event.date = new_datetime

                    if not all([event.title, event.description, event.date, event.duration, event.location, event.type]):
                        return render(request, "unicat/event_form.html", {
                            "username": request.user.username,
                            "event": event,
                            "event_types": Event.types, 
                            "universities": University.choices,
                            "show_toast": True,
                            "toast_message": "Please fill all required fields.",
                            "toast_type": "error",
                            "mode": "edit"
                        })

                    # Set updated_at when editing
                    event.updated_at = timezone.now()
                    
                    # Call full_clean() to trigger model validation
                    event.full_clean()
                    event.save()
                    
                    # Verificar de dónde vino la solicitud y redirigir en consecuencia
                    source = request.POST.get('source')
                    timestamp = int(timezone.now().timestamp())
                    if source == 'detail':
                        # Si vino de la página de detalles, redirigir de vuelta allí
                        return redirect(f'{reverse("event_detail", args=[event.id])}?action=edit&status=success&t={timestamp}')
                    else:
                        # Por defecto, redirigir a la página de eventos
                        return redirect(f'{reverse("events")}?action=edit&status=success&t={timestamp}')
                        
                except ValidationError as e:
                    error_message = "Event date and time must be in the future."
                    if hasattr(e, 'message_dict') and 'date' in e.message_dict:
                        error_message = e.message_dict['date'][0]
                    
                    return render(request, "unicat/event_form.html", {
                        "username": request.user.username,
                        "event": event,
                        "event_types": Event.types,
                        "universities": University.choices,
                        "show_toast": True,
                        "toast_message": error_message,
                        "toast_type": "error",
                        "mode": "edit"
                    })
                except Exception as e:
                    print(f"Error saving event: {e}")
                    # Redirect with error notification parameters
                    return render(request, "unicat/event_form.html", {
                        "username": request.user.username,
                        "event": event,
                        "event_types": Event.types,
                        "universities": University.choices,  
                        "show_toast": True,
                        "toast_message": f"Error updating event: {e}",
                        "toast_type": "error",
                        "mode": "edit"
                    })
            else:
                event.get_university_choices = University.choices
                image=event.image
                context = {
                    'event': event,
                    'event_types': Event.types,  
                    'request': request,
                    'mode': 'edit',
                    'universities': University.choices,
                    'image': image
                }
                return render(request, "unicat/event_form.html", context)
        else:
            # If not the creator, redirect to events page
            return HttpResponseRedirect(reverse("events"))
    except Event.DoesNotExist:
        # If event doesn't exist, redirect to events page
        return HttpResponseRedirect(reverse("events"))
@login_required
def event_detail(request, event_id):
    try:
        event = Event.objects.get(id=event_id)
        
        # Get participants and check if current user is participating
        participants = event.participants.select_related('user').all()
        is_participating = event.is_user_participating(request.user)
        participants_count = event.get_participants_count()
        
        return render(request, "unicat/event_detail.html", {
            "event": event,
            "participants": participants,
            "is_participating": is_participating,
            "participants_count": participants_count,
        })
    except Event.DoesNotExist:
        return HttpResponseRedirect(reverse("events"))

@login_required
def join_event(request, event_id):
    """Handle joining an event"""
    if request.method == "POST":
        try:
            event = get_object_or_404(Event, id=event_id)
            
            # Check if user is already participating
            if event.is_user_participating(request.user):
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({
                        'success': False,
                        'message': 'You are already marked as interested in this event'
                    }, status=400)
                
                return redirect(f'{reverse("event_detail", args=[event_id])}?action=join&status=error')
            
            # Check if the event hasn't passed yet
            if event.date <= timezone.now():
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({
                        'success': False,
                        'message': 'Cannot join past events'
                    }, status=400)
                
                return redirect(f'{reverse("event_detail", args=[event_id])}?action=join&status=error')
            
            # Create participation
            EventParticipant.objects.create(user=request.user, event=event)
            
            # Return JSON response for AJAX
            if request.headers.get('Accept') == 'application/json':
                return JsonResponse({
                    'success': True,
                    'message': f'Successfully marked as interested in {event.title}',
                    'participants_count': event.get_participants_count()
                })
            
            return redirect(f'{reverse("event_detail", args=[event_id])}?action=join&status=success')
            
        except Exception as e:
            print(f"Error joining event: {e}")
            if request.headers.get('Accept') == 'application/json':
                return JsonResponse({
                    'success': False,
                    'message': 'Error joining event'
                }, status=500)
            
            return redirect(f'{reverse("event_detail", args=[event_id])}?action=join&status=error')
    
    return redirect('event_detail', event_id=event_id)

@login_required
def leave_event(request, event_id):
    """Handle leaving an event"""
    if request.method == "POST":
        try:
            event = get_object_or_404(Event, id=event_id)
            
            # Find and delete the user's participation
            participant = EventParticipant.objects.filter(
                user=request.user,
                event=event
            ).first()
            
            if participant:
                participant.delete()
                
                # Return JSON response for AJAX
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({
                        'success': True,
                        'message': f'Successfully removed interest in {event.title}',
                        'participants_count': event.get_participants_count()
                    })
                
                return redirect(f'{reverse("event_detail", args=[event_id])}?action=leave&status=success')
            else:
                # User was not participating in this event
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({
                        'success': False,
                        'message': 'You are not marked as interested in this event'
                    }, status=400)
                
                return redirect(f'{reverse("event_detail", args=[event_id])}?action=leave&status=error')
                
        except Exception as e:
            print(f"Error leaving event: {e}")
            if request.headers.get('Accept') == 'application/json':
                return JsonResponse({
                    'success': False,
                    'message': 'Error leaving event'
                }, status=500)
            
            return redirect(f'{reverse("event_detail", args=[event_id])}?action=leave&status=error')
    
    return redirect('event_detail', event_id=event_id)
    
@login_required   
def erasmus(request):
    # Get all Erasmus programs
    if request.user.is_institution:
        return render(request, "unicat/home.html", {
            "username": request.user,
            "show_toast": True,
            "toast_message": "You do not have permission to view Exchanges programs.",
            "toast_type": "error"
        })

    erasmus_programs = ErasmusProgram.objects.exclude(country_code="ES").order_by('index', 'university')
    # Set up pagination
    paginator = Paginator(erasmus_programs, 40)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    # Get user's registered program
    user_participant = request.user.get_erasmus_program()
    user_program = None
    if user_participant:
        user_program = user_participant.program
    
    # Get user's favorite programs
    user_favorites = []
    if request.user.is_authenticated:
        user_favorites = list(FavouriteErasmusProgram.objects.filter(
            user=request.user
        ).values_list('program_id', flat=True))
    
    return render(request, "unicat/erasmus.html", {
        "username": request.user,
        "countries": Country.objects.all(),
        "erasmus_programs": page_obj,
        "user_program": user_program,
        "user_favorites": user_favorites,  
        "page_obj": page_obj,
        "total_count": erasmus_programs.exclude(country_code="ES").count()
    })

@login_required
def toggle_favorite_erasmus(request, program_id):
    if request.method == "POST":
        try:
            program = get_object_or_404(ErasmusProgram, id=program_id)
            favorite, created = FavouriteErasmusProgram.objects.get_or_create(
                user=request.user,
                program=program
            )
            
            if not created:
                # Already exists, so remove it
                favorite.delete()
                is_favorite = False
                message = f"Removed {program.university} from favorites"
            else:
                # Newly created
                is_favorite = True
                message = f"Added {program.university} to favorites"
            
            # Return JSON response for AJAX
            if request.headers.get('Accept') == 'application/json':
                return JsonResponse({
                    'success': True,
                    'is_favorite': is_favorite,
                    'message': message
                })
            
            # For non-AJAX requests, show toast

            return redirect(f'{reverse("exchanges")}?favorite_action=success&message={message}')

        except Exception as e:
            print(f"Error toggling favorite: {e}")
            if request.headers.get('Accept') == 'application/json':
                return JsonResponse({
                    'success': False,
                    'message': 'Error updating favorites'
                }, status=500)

            return redirect(f'{reverse("exchanges")}?favorite_action=error')

    return redirect('exchanges')

@login_required
def add_erasmus_review(request, program_id):
    if request.method == "POST":
        try:
            program = ErasmusProgram.objects.get(id=program_id)
            participants = program.participants.all()
            is_registered = participants.filter(user=request.user).exists()
            avg = program.average_rating() or 0
            full_stars = int(avg)
            has_half_star = (avg - full_stars) >= 0.5
            empty_stars = 5 - full_stars - (1 if has_half_star else 0)
            
            user_has_reviewed = ErasmusReview.objects.filter(
                user=request.user,
                program=program
            ).exists()
            
            # Get user's favorite programs
            user_favorites = []
            if request.user.is_authenticated:
                user_favorites = list(FavouriteErasmusProgram.objects.filter(
                    user=request.user
                ).values_list('program_id', flat=True))
            
            # Check if the user is already registered for the program
            if not is_registered:
                return render(request, "unicat/erasmus_detail.html", {
                    "program": program,
                    "participants": participants,
                    "is_registered": is_registered,
                    "username": request.user.username,
                    "show_toast": True,
                    "toast_message": "You must be registered for this program to leave a review.",
                    "toast_type": "error",
                    "reviews": program.reviews.all(),
                    "full_stars": full_stars,
                    "has_half_star": has_half_star,
                    "empty_stars": empty_stars,
                    "user_favorites": user_favorites,
                    "user_has_reviewed": user_has_reviewed,  
                })
            
            # Check if the user has already left a review
            if user_has_reviewed:
                return render(request, "unicat/erasmus_detail.html", {
                    "program": program,
                    "participants": participants,
                    "is_registered": is_registered,
                    "username": request.user.username,
                    "show_toast": True,
                    "toast_message": "You have already submitted a review for this program.",
                    "toast_type": "error",
                    "reviews": program.reviews.all(),
                    "full_stars": full_stars,
                    "has_half_star": has_half_star,
                    "empty_stars": empty_stars,
                    "user_favorites": user_favorites,
                    "user_has_reviewed": user_has_reviewed,  
                })
            
            # Get form data
            rating = int(request.POST.get("rating", 0))
            academic_rating = float(request.POST.get("academic_rating", 0))
            housing_rating = float(request.POST.get("housing_rating", 0))
            social_rating = float(request.POST.get("social_rating", 0))
            city_rating = float(request.POST.get("city_rating", 0))
            review_text = request.POST.get("review_text", "")
            tips = request.POST.get("tips", "")
            
            # Validate required fields
            if not rating or not review_text:
                erasmus_reviews = program.reviews.all()
                
                return render(request, "unicat/erasmus_detail.html", {
                    "program": program,
                    "participants": participants,
                    "is_registered": is_registered,
                    "username": request.user.username,
                    "full_stars": full_stars,
                    "has_half_star": has_half_star,
                    "reviews": erasmus_reviews,
                    "empty_stars": empty_stars,
                    "rating": rating,
                    "academic_rating": academic_rating,
                    "housing_rating": housing_rating,
                    "social_rating": social_rating,
                    "city_rating": city_rating,
                    "review_text": review_text,
                    "tips": tips,
                    "show_toast": True,
                    "toast_message": "Please fill all required fields.",
                    "toast_type": "error",
                    "user_favorites": user_favorites,
                    "user_has_reviewed": user_has_reviewed, 
                })
            
            # All checks passed, create and save the review
            review = ErasmusReview(
                user=request.user,
                program=program,
                rating=rating,
                academic_rating=academic_rating,
                housing_rating=housing_rating,
                social_rating=social_rating,
                city_rating=city_rating,
                review_text=review_text,
                tips=tips
            )
            review.save()
            
            # Redirect to the program detail page with success message
            return redirect(f'{reverse("exchanges_detail", args=[program_id])}?action=review&status=success')

        except ErasmusProgram.DoesNotExist:
            return redirect(reverse("exchanges"))
        except Exception as e:
            print(f"Error submitting review: {e}")
            return redirect(reverse("exchanges_detail", args=[program_id]))
    
    # If not POST, redirect to the program detail page
    return redirect(reverse("exchanges_detail", args=[program_id]))
@login_required
def erasmus_detail(request, program_id):
    try:
        if request.user.is_institution:
            return render(request, "unicat/erasmus.html", {
                "username": request.user,
                "show_toast": True,
                "toast_message": "You do not have permission to view this page.",
                "toast_type": "error"
            })

        program = ErasmusProgram.objects.get(id=program_id)
        participants = program.participants.all()
        avg = program.average_rating() or 0
        full_stars = int(avg)
        has_half_star = (avg - full_stars) >= 0.5
        erasmus_reviews = program.reviews.all()
        erasmus_reviews = erasmus_reviews.order_by('-created_at')
        empty_stars = 5 - full_stars - (1 if has_half_star else 0)
        
        # Check if the user is already registered for this program
        is_registered = False
        is_registered = participants.filter(user=request.user).exists()
        
        user_has_reviewed = False
        if request.user.is_authenticated:
            user_has_reviewed = ErasmusReview.objects.filter(
                user=request.user,
                program=program
            ).exists()
        
        # Get user's favorite programs
        user_favorites = []
        if request.user.is_authenticated:
            user_favorites = list(FavouriteErasmusProgram.objects.filter(
                user=request.user
            ).values_list('program_id', flat=True))
        
        is_registered_in_any_program = request.user.is_in_erasmus()
        
        return render(request, "unicat/erasmus_detail.html", {
            "program": program,
            "participants": participants,
            "is_registered": is_registered,
            "username": request.user.username,
            "full_stars": full_stars,
            "has_half_star": has_half_star,
            "reviews": erasmus_reviews,
            "empty_stars": empty_stars,
            "user_favorites": user_favorites,
            "is_registered_in_any_program": is_registered_in_any_program,
            "user_has_reviewed": user_has_reviewed,
        })
    except ErasmusProgram.DoesNotExist:
        return HttpResponseRedirect(reverse("exchanges"))

@login_required
def erasmus_form(request, program_id, main=None):
    if request.method == "POST":
        if request.user.is_institution:
            return render(request, "unicat/home.html", {
                "username": request.user,
                "show_toast": True,
                "toast_message": "You do not have permission to view Exchanges programs.",
                "toast_type": "error"
            })
        if request.user.is_in_erasmus():
            return redirect(f'{reverse("exchanges")}?action=connect&status=error')

        country_name = request.POST.get("country_destination")
        university = request.POST.get("erasmus_university")
        start_date = request.POST.get("erasmus_startdate")
        end_date = request.POST.get("erasmus_enddate")
        contact_info = request.POST.get("contact_info")
        interests = request.POST.get("interests")

        try:
            
            erasmus_program = ErasmusProgram.objects.get(id=program_id)
            

            existing_participant = ErasmusParticipant.objects.filter(
                user=request.user,
                program=erasmus_program
            ).exists()
            
            if existing_participant:
                error_message = "You are already registered for this program."
                return render(request, "unicat/erasmus_form.html", {
                    "username": request.user.username,
                    "countries": Country.objects.all(),
                    "error_message": error_message,
                    "program": erasmus_program if program_id else None,
                    "show_toast": True,
                    "toast_message": "You are already registered for this program.",
                    "toast_type": "error",
                    "erasmus": {
                        "university": university,
                        "country": country_name,
                        "startdate": start_date,
                        "enddate": end_date,
                        "contact_info": contact_info,
                        "interests": interests
                    }
                })
            
            participant = ErasmusParticipant(
                user=request.user,
                program=erasmus_program,
                start_date=start_date,
                end_date=end_date,
                contact_info=contact_info,
                interests=interests,
            )
            participant.save()
            
            # Redirect with URL parameters for success toast

            return redirect(f'{reverse("exchanges_detail", args=[erasmus_program.id])}?action=connect&status=success')

        except Exception as e:
            print(f"Error registering the user: {e}")
            error_message = "There was an error while registering. Please try again."
            
            # Return with error toast when exception occurs
            return render(request, "unicat/erasmus_form.html", {
                "username": request.user.username,
                "countries": Country.objects.all(),
                "error_message": error_message,
                "program": ErasmusProgram.objects.get(id=program_id) if program_id else None,
                "show_toast": True,
                "toast_message": "There was an error while registering. Please try again.",
                "toast_type": "error",
                "erasmus": {  
                    "university": university,
                    "country": country_name,
                    "startdate": start_date,
                    "enddate": end_date,
                    "contact_info": contact_info,
                    "interests": interests
                }
            })
    if request.user.is_institution:
        return render(request, "unicat/home.html", {
            "username": request.user,
            "show_toast": True,
            "toast_message": "You do not have permission to view Exchanges programs.",
            "toast_type": "error"
        })
    # GET request handling - display the form
    program = ErasmusProgram.objects.get(id=program_id)
    
    return render(request, "unicat/erasmus_form.html", {
        "username": request.user.username,
        "countries": Country.objects.all(),
        "program": program,
        "main": main
    })



@api_view(['GET'])
def get_resources(request):
    # Obtener parámetros de filtro
    search_query = request.GET.get('search', '')
    filter_category = request.GET.get('category', '')
    filter_field_study = request.GET.get('field_study', '')
    
    # Empezar con todos los recursos
    resources = Resource.objects.all().order_by('-timestamp')
    
    # Aplicar búsqueda si se proporciona
    if search_query:
        resources = resources.filter(
            Q(description__icontains=search_query) |
            Q(document__contains=search_query)
        ).distinct()
    
    # Filtrar recursos si se especifica una categoría
    if filter_category:
        resources = resources.filter(type=filter_category)
        
    # Filtrar recursos si se especifica un campo de estudio
    if filter_field_study:
        resources = resources.filter(field_of_study=filter_field_study)
    
    # Paginar resultados
    paginator = PageNumberPagination()
    paginator.page_size = 5
    results = paginator.paginate_queryset(resources, request)

    serializer = ResourceSerializer(results, many=True)
    response = paginator.get_paginated_response(serializer.data)
    
    # Añadir información del usuario actual a la respuesta
    response.data['current_user'] = request.user.username
    
    return response

@login_required
def resources(request):
    if request.method == "POST":
        user = request.user
        document = request.FILES.get('document')
        description = request.POST.get('description')
        field_study = request.POST.get('field_study')
        resource_type = request.POST.get('category')
        
     
        try:
            resource = Resource(user=user, description=description, type=resource_type, field_of_study=field_study)
            if document:
                resource.document = document
            resource.save()
            return redirect(f'{reverse("resources")}?action=create&status=success')
        except Exception as e:
            print(f"Error saving resource: {e}")
            return redirect(f'{reverse("resources")}?action=create&status=error')
    
    # Get filter and search parameters from GET request
    filter_category = request.GET.get('category', '')
    filter_field_study = request.GET.get('field_study', '')
    search_query = request.GET.get('q', '')
    
    # Start with all resources
    resources_list = Resource.objects.all()
    
    # Apply search if provided
    if search_query:
        resources_list = resources_list.filter(
            Q(description__icontains=search_query) |
            Q(document__contains=search_query)
        ).distinct()
    
    # Filter resources if a category is specified
    if filter_category:
        resources_list = resources_list.filter(type=filter_category)
        
    # Filter resources if a field of study is specified
    if filter_field_study:
        resources_list = resources_list.filter(field_of_study=filter_field_study)
    
    # Sort resources by timestamp (newest first)
    resources_list = resources_list.order_by('-timestamp')
    field_study = Field_Study.objects.all()
    # If there are no resources after filtering, don't paginate
    if not resources_list:
        return render(request, "unicat/resources.html", {
            "resources": resources_list,
            "categories": Resource.types,
            "selected_category": filter_category,
            "selected_field_study": filter_field_study,  
            "search_query": search_query,
            "username": request.user,
            "fields": field_study
        })
    

    

    return render(request, "unicat/resources.html", {
        "categories": Resource.types,
        "selected_category": filter_category,
        "selected_field_study": filter_field_study,
        "search_query": search_query,
        "username": request.user,
        "fields": field_study
    })


@login_required
def edit_resource(request, resource_id, main=None):
    try:
        resource = Resource.objects.get(id=resource_id)
        
        if request.user != resource.user:
            return HttpResponseRedirect(reverse("resources"))
        
        if request.method == "POST":
            # Comprovar si s'ha marcat eliminar el fitxer actual
            delete_current_file = request.POST.get('delete_current_file') == 'true'
            
            # Actualitzar camps
            resource.description = request.POST.get('description')
            resource.field_of_study = request.POST.get('field_study')
            resource.type = request.POST.get('category')
            
            # Gestionar eliminació del fitxer actual
            if delete_current_file and resource.document:
                try:
                    # Eliminar fitxer físic
                    resource.document.delete(save=False)
                    print(f"Deleted current file for resource {resource.id}")
                except Exception as e:
                    print(f"Error deleting current file: {e}")
            
            new_document = request.FILES.get('document')
            if new_document:
                # Si hi ha fitxer nou, eliminar l'anterior (si no s'ha eliminat ja)
                if resource.document and not delete_current_file:
                    try:
                        resource.document.delete(save=False)
                    except Exception as e:
                        print(f"Error deleting old file: {e}")
                
                # Assignar nou fitxer
                resource.document = new_document
            
            # Marcar com editat
            resource.updated_at = timezone.now()
            resource.save()
            
            # Response AJAX o redirect
            if request.headers.get('Accept') == 'application/json':
                return JsonResponse({'success': True})
            
            if main==1:
                return redirect(f'{reverse("resource_detail", args=[resource_id])}?action=edit&status=success')

            else:
                return redirect(f'{reverse("resources")}?action=edit&status=success')
    except Resource.DoesNotExist:
        if request.headers.get('Accept') == 'application/json':
            return JsonResponse({'success': False}, status=404)
        return HttpResponseRedirect(reverse("resources"))

@login_required
def delete_resource(request, resource_id):
    try:
        # Get the resource
        resource = Resource.objects.get(id=resource_id)
        
        # Check if user is the owner
        if request.user != resource.user:
            return HttpResponseRedirect(reverse("resources"))
        
        if resource.document:
            try:
                # Delete the physical file from media folder
                resource.document.delete(save=False)
                print(f"Deleted document file for resource: {resource.id}")
            except Exception as e:
                print(f"Error deleting document file for resource {resource.id}: {e}")
        
        # Delete the resource from database
        resource.delete()
        
        # Check if this is an AJAX request (from resources.js)
        if request.headers.get('Accept') == 'application/json':
            return JsonResponse({'success': True})
        
    except Resource.DoesNotExist:
        if request.headers.get('Accept') == 'application/json':
            return JsonResponse({'success': False}, status=404)
    
    # Redirect back to resources with success parameters
    return redirect(f'{reverse("resources")}?action=delete&status=success')

@login_required
def resource_detail(request, resource_id):
    try:
        resource = Resource.objects.get(id=resource_id)
        content_type = ContentType.objects.get_for_model(Resource)
        
        # Get only parent comments (not replies)
        comments = Comment.objects.filter(
            content_type=content_type,
            object_id=resource_id,
            parent=None  # Only parent comments
        ).order_by('-created_at')
        total_comments = resource.comments.count()
        print(comments)
        # Get all fields of study for the dropdown
        fields_of_study = Field_Study.objects.all().order_by('order', 'name')
        
        return render(request, "unicat/resource_detail.html", {
            "resource": resource,
            "comments": comments,
            "username": request.user.username,
            "categories": Resource.types,
            "total_comments": total_comments,
            "fields_of_study": fields_of_study
        })
    except Resource.DoesNotExist:
        return HttpResponseRedirect(reverse("resources"))

@login_required
def add_comment(request, resource_id):
    if request.method == "POST":
        try:
            content_type = ContentType.objects.get_for_model(Resource)
            
            # Get form data
            text = request.POST.get("text")
            parent_id = request.POST.get("parent_id")
            
            if text:
                if parent_id:
                    # This is a reply to an existing comment
                    parent_comment = get_object_or_404(Comment, id=parent_id)
                    comment = Comment(
                        user=request.user,
                        text=text,
                        content_type=content_type,
                        object_id=resource_id,
                        parent=parent_comment
                    )
                    comment_type = 'reply'
                else:
                    # This is a new top-level comment
                    comment = Comment(
                        user=request.user,
                        text=text,
                        content_type=content_type,
                        object_id=resource_id
                    )
                    comment_type = 'comment'
                
                comment.save()
                
                # Afegir paràmetres per a la notificació
                return redirect(f'{reverse("resource_detail", args=[resource_id])}?action=add_comment&status=success&type={comment_type}')
                
        except Exception as e:
            print(f"Error adding comment: {e}")
            return redirect(f'{reverse("resource_detail", args=[resource_id])}?action=add_comment&status=error')
            
    return HttpResponseRedirect(reverse("resource_detail", args=[resource_id]))

@login_required
def edit_comment(request, resource_id, comment_id):
    if request.method == "POST":
        try:
            comment = get_object_or_404(Comment, id=comment_id)
            
            # Verificar que l'usuari actual és el propietari del comentari
            if request.user != comment.user:
                return HttpResponseRedirect(reverse("resource_detail", args=[resource_id]))
            
            # Obtenir el nou text del comentari
            text = request.POST.get("text")
            
            if text:
                comment.text = text

                comment.updated_at = timezone.now()  
                comment.save()
            
            comment_type = 'reply' if comment.parent else 'comment'
            # Afegir paràmetres per a la notificació
            return redirect(f'{reverse("resource_detail", args=[resource_id])}?action=edit_comment&status=success&type={comment_type}')
                
        except Exception as e:
            print(f"Error editant comentari: {e}")
            return redirect(f'{reverse("resource_detail", args=[resource_id])}?action=edit_comment&status=error&type={comment_type}')
            
    return HttpResponseRedirect(reverse("resource_detail", args=[resource_id]))

@login_required
def delete_comment(request, resource_id, comment_id, comment_type='comment'):
    if request.method == "POST":
        try:
            comment = get_object_or_404(Comment, id=comment_id)
            
            # Verificar que l'usuari actual és el propietari del comentari
            if request.user != comment.user:
                return HttpResponseRedirect(reverse("resource_detail", args=[resource_id]))
            
            # Eliminar el comentari
            comment.delete()
            
            # Afegir paràmetres per a la notificació
            return redirect(f'{reverse("resource_detail", args=[resource_id])}?action=delete_comment&status=success&type={comment_type}')
                
        except Exception as e:
            print(f"Error eliminant comentari: {e}")
            return redirect(f'{reverse("resource_detail", args=[resource_id])}?action=delete_comment&status=error&type={comment_type}')
            
    return HttpResponseRedirect(reverse("resource_detail", args=[resource_id]))
@login_required
def profile_view(request, username=None):
    if username:
        user_profile = get_object_or_404(User, username=username)
    else:
        user_profile = request.user

    profile, created = Profile.objects.get_or_create(user=user_profile)

    # Get user's current Erasmus program (only if viewing own profile)
    user_erasmus_program = None
    if user_profile == request.user:
        user_erasmus_program = user_profile.get_erasmus_program()
    

    has_permissions = request.user.is_institution
    print(f"User has permissions: {has_permissions}")
    if has_permissions:
        events_organized = Event.objects.filter(created_by=request.user).order_by('-date')
        print(f"Events organized by user: {events_organized}")
    else:
        event_interested_num = EventParticipant.objects.filter(user=request.user).count()
    context = {
        'user': user_profile,
        'profile': profile,  
        'university_choices': University.choices,
        'is_own_profile': user_profile == request.user,
        'user_erasmus_program': user_erasmus_program,
        'has_permissions': has_permissions,
        'event_interested_num': event_interested_num if not has_permissions else None,
        'events_organized': events_organized if has_permissions else None,
    }
    return render(request, 'unicat/profile.html', context)

@login_required
def edit_profile(request):
    #Assegurar que existeix un perfil per l'usuari
    profile, created = Profile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        # Actualitzar dades de l'usuari
        request.user.first_name = request.POST.get('first_name', '')
        request.user.last_name = request.POST.get('last_name', '')
        request.user.university = request.POST.get('university', '')
        request.user.save()
        
        # Actualitzar dades del perfil
        profile.city = request.POST.get('city', '')
        profile.bio = request.POST.get('bio', '')
        profile.contact_info = request.POST.get('contact-info', '')
        profile.linkedin_url = request.POST.get('linkedin_url', '') 
        
        # Gestionar la foto de perfil
        if 'profile_picture' in request.FILES:
            # Eliminar foto anterior si existeix
            if profile.profile_picture:
                profile.profile_picture.delete(save=False)
            profile.profile_picture = request.FILES['profile_picture']
        elif request.POST.get('remove_picture'):
            # Eliminar foto actual
            if profile.profile_picture:
                profile.profile_picture.delete(save=False)
                profile.profile_picture = None
        
        profile.save()
        
        # Redirigir al perfil
        return redirect(f'{reverse("profile")}?action=edit_profile&status=success')

    # Si no és POST, redirigir al perfil
    return redirect('profile')

@api_view(['GET'])
def get_erasmus_programs(request):
    # Get filter parameters
    university_filter = request.GET.get('university', '')
    #  Handle multiple country filters
    country_filters = request.GET.getlist('country')  # Changed from get() to getlist()
    favorites_filter = request.GET.get('favorites', '')
    sort_filter = request.GET.get('sort', '')
    
    # Start with all Erasmus programs
    erasmus_programs = ErasmusProgram.objects.exclude(country_code="ES")

    # Apply filters if provided
    if university_filter:
        erasmus_programs = erasmus_programs.filter(university__icontains=university_filter)
    
    # Apply country filters (multiple countries)
    if country_filters:
        erasmus_programs = erasmus_programs.filter(country_code__name__in=country_filters)

    # Apply favorites filter if provided
    if favorites_filter and request.user.is_authenticated:
        user_favorite_ids = set(FavouriteErasmusProgram.objects.filter(
            user=request.user
        ).values_list('program_id', flat=True))
        
        if favorites_filter == 'favorites':
            # Show only favorite programs
            erasmus_programs = erasmus_programs.filter(id__in=user_favorite_ids)
        elif favorites_filter == 'not_favorites':
            # Show only non-favorite programs
            erasmus_programs = erasmus_programs.exclude(id__in=user_favorite_ids)
    
    if sort_filter:
        if sort_filter == 'rating_desc':
            erasmus_programs = erasmus_programs.order_by('-cached_average_rating')
        elif sort_filter == 'rating_asc':
            erasmus_programs = erasmus_programs.order_by('cached_average_rating')
        elif sort_filter == 'name_asc':
            erasmus_programs = erasmus_programs.order_by('university')
        elif sort_filter == 'name_desc':
            erasmus_programs = erasmus_programs.order_by('-university')
        elif sort_filter == 'qs_rank_asc':
            erasmus_programs = erasmus_programs.order_by('-index')
    else:
        # Default sorting: Highest QS Rank (lowest index numbers = better ranking)
        erasmus_programs = erasmus_programs.order_by('index')

    # Paginate results
    paginator = PageNumberPagination()
    paginator.page_size = 60
    results = paginator.paginate_queryset(erasmus_programs, request)
    
    # Get user's registered programs and favorites
    user_program_ids = set()
    user_favorites = []
    if request.user.is_authenticated:
        user_program_ids = set(ErasmusParticipant.objects.filter(
            user=request.user
        ).values_list('program_id', flat=True))
        
        user_favorites = list(FavouriteErasmusProgram.objects.filter(
            user=request.user
        ).values_list('program_id', flat=True))
    
    # Serialize the data with additional fields
    serializer = ErasmusProgramSerializer(results, many=True, context={
        'user_program_ids': user_program_ids,
        'user_favorites': user_favorites,
        'request': request
    })
    
    response = paginator.get_paginated_response(serializer.data)
    response.data['total_count'] = erasmus_programs.model.objects.exclude(country_code="ES").count()

    return response

@login_required
def disconnect_erasmus(request, program_id):
    """Handle disconnection from an Erasmus program"""
    if request.method == "POST":
        try:
            program = get_object_or_404(ErasmusProgram, id=program_id)
            
            # Find and delete the user's participation
            participant = ErasmusParticipant.objects.filter(
                user=request.user,
                program=program
            ).first()
            
            if participant:
                participant.delete()
                message = f"Successfully disconnected from {program.university}"
                
                # Return JSON response for AJAX
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({
                        'success': True,
                        'message': message
                    })
                
                # For non-AJAX requests
                return redirect(f'{reverse("exchanges_detail", args=[program_id])}?action=disconnect&status=success')
            else:
                # User was not connected to this program
                if request.headers.get('Accept') == 'application/json':
                    return JsonResponse({
                        'success': False,
                        'message': 'You are not connected to this program'
                    }, status=400)

                return redirect(f'{reverse("exchanges_detail", args=[program_id])}?action=disconnect&status=error')

        except Exception as e:
            print(f"Error disconnecting from program: {e}")
            if request.headers.get('Accept') == 'application/json':
                return JsonResponse({
                    'success': False,
                    'message': 'Error disconnecting from program'
                }, status=500)

            return redirect(f'{reverse("exchanges_detail", args=[program_id])}?action=disconnect&status=error')

    return redirect('exchanges_detail', program_id=program_id)

@login_required
def submit_bug_report(request):
    if request.method == 'POST':
        try:
            # Create bug report
            bug_report = BugReport.objects.create(
                user=request.user if request.user.is_authenticated else None,
                title=request.POST.get('title', ''),
                description=request.POST.get('description', ''),
                page_url=request.POST.get('page_url', ''),
                severity=request.POST.get('severity', 'medium'),
                report_type=request.POST.get('report_type', 'bug'),
            )
            
            print(f"Bug report created with ID: {bug_report.id}")

            # Send notification email to admin
            try:
                send_bug_report_notification(bug_report)
                print("Email notification sent successfully")
            except Exception as email_error:
                print(f"Email notification failed: {email_error}")

            # Redirect amb paràmetres per mostrar toast
            page_url = request.POST.get('page_url', '/')
            
    
                
            
            # Afegir paràmetres per al toast de success
            return redirect(f'{page_url}?action=bug_report&status=success')
            
        except Exception as e:
            print(f"Error submitting bug report: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()

            # Redirect amb paràmetres d'error
            page_url = request.POST.get('page_url', '/')
            page_url = reverse('home')
                
            
            return redirect(f'{page_url}?action=bug_report&status=error')
            
    return redirect('index')

def send_bug_report_notification(bug_report):
    """Send email notification to admin about new bug report"""
    try:
        from django.core.mail import send_mail
        from django.conf import settings

        # Usar el email de configuració
        admin_email = getattr(settings, 'BUG_REPORT_EMAIL', 'albert.arboles06@gmail.com')
        site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
        
        subject = f"New Bug Report: {bug_report.title}"

        # Email amb més detalls
        message = f"""
📋 NEW BUG REPORT SUBMITTED
============================

📝 Title: {bug_report.title}
🔧 Type: {bug_report.get_report_type_display()}
⚠️  Severity: {bug_report.get_severity_display()}
👤 User: {bug_report.user.username if bug_report.user else 'Anonymous'}
📧 Email: {bug_report.user.email if bug_report.user else 'N/A'}
🌐 Page: {bug_report.page_url}
📅 Time: {bug_report.created_at.strftime('%d/%m/%Y %H:%M:%S')}

📖 Description:
{bug_report.description}

🔗 View in admin: {site_url}/admin/unicat/bugreport/{bug_report.id}/

---
This is an automated notification from UniCat Bug Report System
        """
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">🐛 New Bug Report</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">{bug_report.title}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">{bug_report.get_report_type_display()}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Severity:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">{bug_report.get_severity_display()}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>User:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">{bug_report.user.username if bug_report.user else 'Anonymous'}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Page:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><a href="{bug_report.page_url}">{bug_report.page_url}</a></td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td style="padding: 8px 0;">{bug_report.created_at.strftime('%d/%m/%Y %H:%M:%S')}</td></tr>
                </table>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #e9ecef; border-top: none;">
                <h3 style="margin-top: 0; color: #495057;">Description:</h3>
                <p style="white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">{bug_report.description}</p>
                
                <div style="margin-top: 20px; text-align: center;">
                    <a href="{site_url}/admin/unicat/bugreport/{bug_report.id}/" 
                       style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        🔗 View in Admin Panel
                    </a>
                </div>
            </div>
            
            <div style="background: #6c757d; color: white; padding: 10px 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
                Automated notification from UniCat Bug Report System
            </div>
        </body>
        </html>
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [admin_email],
            fail_silently=False,
            html_message=html_message
        )

        print(f" Bug report notification sent to {admin_email}")
        return True
        
    except Exception as e:
        print(f" Error sending bug report notification: {e}")
        import traceback
        traceback.print_exc()
        return False
