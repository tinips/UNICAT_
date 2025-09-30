from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid
from datetime import timedelta

class University(models.Model):
    choices = (
        ('UB', 'Universitat de Barcelona'),
        ('UAB', 'Universitat Autònoma de Barcelona'),
        ('UPC', 'Universitat Politècnica de Catalunya'),
        ('UPF', 'Universitat Pompeu Fabra'),
        ('URV', 'Universitat Rovira i Virgili'),
        ('UdG', 'Universitat de Girona'),
        ('UdL', 'Universitat de Lleida'),
        ('UOC', 'Universitat Oberta de Catalunya'),
        ('UVic', 'Universitat de Vic'),
        ('UIC', 'Universitat Internacional de Catalunya'),
        ('URL', 'Universitat Ramon Llull'),
        ('UAO', 'Universitat Abat Oliba CEU (UAO)'),
        ('EAE', 'EAE Business School'),
        ('Other', 'Other'),
    )


class User(AbstractUser):
    university = models.CharField(max_length=64, choices=University.choices, default='', blank=False)
    is_email_verified = models.BooleanField(default=False)
    is_institution = models.BooleanField(default=False)
    events_count = models.IntegerField(default=0)  
    
    def is_in_erasmus(self):
        """
        Check if the user is currently participating in an Erasmus program.
        """
        return ErasmusParticipant.objects.filter(user=self).exists()
    
    def get_erasmus_program(self):
        try:
            return ErasmusParticipant.objects.select_related('program').get(user=self)
        except ErasmusParticipant.DoesNotExist:
            return None
    



class Event(models.Model):
    title = models.CharField(max_length=255, default='', blank=False)
    description = models.TextField(default='', blank=False)
    date = models.DateTimeField(blank=False)
    duration = models.CharField(max_length=64, default='', blank=False)
    faculty = models.CharField(max_length=255, default='', blank=True)
    location = models.CharField(max_length=255, default='', blank=False)
    university = models.CharField(max_length=64, choices=University.choices, default='', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='event_images/', blank=True, null=True)
    program_file = models.FileField(upload_to='event_programs/', blank=True, null=True)
    inscription_link = models.URLField(max_length=255, blank=True, null=True)
    
    types = (
        ('conference', 'Conference'),
        ('workshop', 'Workshop'),
        ('seminar', 'Seminar'),
        ('networking', 'Networking'),
        ('hackathon', 'Hackathon'),
        ('course', 'Course'),
        ('open house', 'Open House'),
        ('party', 'Party'),
        ('other', 'Other')
    )
    type = models.CharField(max_length=64, choices=types, default='', blank=False)

    def clean(self):
        """Validate that the event date is in the future"""
        super().clean()
        if self.date:
            # ✅ Make sure both datetimes have the same timezone awareness
            current_time = timezone.now()
            event_date = self.date
            
            # If event_date is naive, make it aware using current timezone
            if timezone.is_naive(event_date):
                event_date = timezone.make_aware(event_date, timezone.get_current_timezone())
            
            # Now we can safely compare them
            if event_date <= current_time:
                raise ValidationError({
                    'date': 'Event date and time must be in the future.'
                })
    
    def get_participants_count(self):
        """Get the number of participants for this event"""
        return self.participants.count()
    
    def is_user_participating(self, user):
        """Check if a user is participating in this event"""
        return self.participants.filter(user=user).exists()

    def __str__(self):
        return self.title

class EventParticipant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, related_name='participants', null=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'event')
    
    def __str__(self):
        event_title = self.event.title if self.event else "(no event)"
        return f"{self.user.username} - {event_title}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)  

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    parent=models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)

    def was_edited(self):
        """Check if the comment was edited after creation"""
        if self.created_at and self.updated_at:
            # Allow 5 seconds difference for server processing
            time_diff = (self.updated_at - self.created_at).total_seconds()
            return time_diff > 5
        return False
    def edit_display(self):
        """Return the formatted edit date if it was edited"""
        if self.was_edited():
            return f"Last edit {self.updated_at.strftime('%d/%m/%Y')}"
        return ""

    def __str__(self):
        return f"{self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Comments"
class Country(models.Model):
    code = models.CharField(max_length=3, unique=True, primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    class Meta:
        verbose_name_plural = "Countries"
        ordering = ['name']

    def __str__(self):
        return self.code

class Field_Study(models.Model):
    name = models.CharField(max_length=255, unique=True, primary_key=True)
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Fields of Study"
        ordering = ['order', 'name']  

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if self.name == 'Other':
            self.order = 1
        else:
            self.order = 0
        super().save(*args, **kwargs)

class Resource(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    document = models.FileField(upload_to='resources/', blank=True, null=True)
    description = models.TextField(default='', blank=False)
    types = (
        ('slides', 'Slides'),
        ('pdf', 'Pdf'),
        ('video', 'Video'),
        ('web', 'Web'),
        ('image', 'Image'),
        ('other', 'Other')
    )
    type = models.CharField(max_length=64, choices=types, default='', blank=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    field_of_study = models.CharField(max_length=64, default='', blank=False)
    comments = GenericRelation(Comment)
    updated_at = models.DateTimeField(null=True, blank=True)  

    def was_edited(self):
        """Comprova si el recurs va ser editat després de la creació"""
        if self.timestamp and self.updated_at:
            # Permet 5 segons de diferència per processos del servidor
            time_diff = (self.updated_at - self.timestamp).total_seconds()
            return time_diff > 5
        return False
    
    def edit_display(self):
        """Retorna la data d'edició formatada si va ser editat"""
        if self.was_edited():
            return f"Last edit {self.updated_at.strftime('%d %b, %Y')}"
        return ""
    
   


class ErasmusProgram(models.Model):
    index= models.IntegerField(blank=True, null=True)
    university = models.CharField(max_length=200, default='', blank=False)                                 
    city = models.CharField(max_length=255, blank=True, null=True)
    rank = models.CharField(max_length=20, blank=True, null=True)
    country_code = models.ForeignKey(Country, blank=True, null=True,default="", on_delete=models.SET_NULL)
    size = models.CharField(max_length=50, blank=True, null=True)
    focus = models.CharField(max_length=100, blank=True, null=True)
    research = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    static_image = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Nom del fitxer d'imatge a static/unicat/images/erasmus/"
    )
    cached_average_rating = models.FloatField(default=0)

    ar_score = models.FloatField(blank=True, null=True)
    ar_rank = models.CharField(max_length=20, blank=True, null=True)
    er_score = models.FloatField(blank=True, null=True)
    er_rank = models.CharField(max_length=20, blank=True, null=True)
    fsr_score = models.FloatField(blank=True, null=True)
    fsr_rank = models.CharField(max_length=20, blank=True, null=True)
    cpf_score = models.FloatField(blank=True, null=True)
    cpf_rank = models.CharField(max_length=20, blank=True, null=True)
    ifr_score = models.FloatField(blank=True, null=True)
    ifr_rank = models.CharField(max_length=20, blank=True, null=True)
    isr_score = models.FloatField(blank=True, null=True)
    isr_rank = models.CharField(max_length=20, blank=True, null=True)
    irn_score = models.FloatField(blank=True, null=True)
    irn_rank = models.CharField(max_length=20, blank=True, null=True)
    ger_score = models.FloatField(blank=True, null=True)
    ger_rank = models.CharField(max_length=20, blank=True, null=True)
    sus_score = models.FloatField(blank=True, null=True)
    sus_rank = models.CharField(max_length=20, blank=True, null=True)
    overall_score = models.FloatField(blank=True, null=True)

    def update_average_rating(self, new_rating=None):
        # When saving overall rating, ensure it's an integer
        if new_rating is not None:
            new_rating = int(new_rating)
        
        if new_rating is None:
            # Recalcular desde todas las reviews
            ratings = self.reviews.all()
            if ratings.count() > 0:
                # Convert all ratings to integers before averaging
                self.cached_average_rating = sum(int(r.rating) for r in ratings) / ratings.count()
            else:
                self.cached_average_rating = 0
        else:
            # Actualizar con la nueva review
            current_count = self.reviews.count() - 1  # Restamos 1 porque la nueva review ya está en la BD
            if current_count > 0:
                current_sum = self.cached_average_rating * current_count
                self.cached_average_rating = (current_sum + new_rating) / (current_count + 1)
            else:
                self.cached_average_rating = new_rating
        
        self.save(update_fields=['cached_average_rating'])
        return self.cached_average_rating
    
    def average_rating(self):
      
        self.update_average_rating()
        return self.cached_average_rating
 
    
    def full_stars(self):
        """
        Return the number of full stars for the rating.
        """
        avg = self.average_rating() or 0  # Call the method to get the value
        return int(avg)  # Return just the integer part
    
    
    def has_half_star(self):
        """
        Return True if the rating should show a half star.
        """
        avg = self.average_rating() or 0
        return (avg - int(avg)) >= 0.5
        
    def total_ratings(self):
        return self.reviews.count()
    
    def get_pct_rating(self, num_star):
        # Filter by exact integer rating value
        matching_reviews = self.reviews.filter(rating=num_star).count()
        
        total_reviews = self.total_ratings()
        if total_reviews > 0:
            return (matching_reviews / total_reviews) * 100
        return 0
        
    def reviews_breakdown(self):
        breakdown = []
        for star in range(5, 0, -1):  # For star ratings 5 through 1
            # Calculate percentage and round to integer
            percentage = int(round(self.get_pct_rating(star)))
            breakdown.append((star, percentage))

        return breakdown

    

    def __str__(self):
        return f"{self.university} ({self.country_code})"

    class Meta:
        verbose_name_plural = "Erasmus Programs"
        #unique_together = ('university', 'country_code')


class ErasmusParticipant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    program = models.ForeignKey(ErasmusProgram, on_delete=models.CASCADE, related_name='participants')
    start_date = models.DateField()
    end_date = models.DateField()
    contact_info = models.CharField(max_length=255)
    interests = models.TextField(blank=True)



    def __str__(self):
        return f"{self.user.username} - {self.program.university} ({self.start_date} a {self.end_date})"

    class Meta:
        unique_together = ('user', 'program')

class FavouriteErasmusProgram(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    program = models.ForeignKey(ErasmusProgram, on_delete=models.CASCADE, related_name='favourites')

    def __str__(self):
        return f"{self.user.username} - {self.program.university}"

    class Meta:
        unique_together = ('user', 'program')

class ErasmusReview(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    program = models.ForeignKey(ErasmusProgram, on_delete=models.CASCADE, related_name='reviews')
    review_text = models.TextField()
    rating = models.IntegerField(blank=False)  # Rating from 1 to 5 stars
    academic_rating = models.FloatField(default=None, blank=True, null=True)
    housing_rating = models.FloatField(default=None, blank=True, null=True)
    social_rating = models.FloatField(default=None, blank=True, null=True)
    city_rating = models.FloatField(default=None, blank=True, null=True)
    tips = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def has_half_star(self, field_name="rating"):
        """
        Check if the rating has a half-star increment.
        """
        value = getattr(self, field_name, 0)
        return value - int(value) >= 0.5
    
    def integer_stars(self, field_name="rating"):  
        """
        Return the integer part of the rating.
        """
        value = getattr(self, field_name, 0)
        return int(value)



    def __str__(self):
        return f"{self.user.username} - {self.program.university} ({self.rating} stars)"
    
    class Meta:
        verbose_name_plural = "Erasmus Reviews"
        unique_together = ('user', 'program')  




class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    city = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True)
    contact_info = models.TextField(blank=True)
    linkedin_url = models.URLField(blank=True, null=True)  


    def __str__(self):
        return self.user.username

class EmailVerificationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_expired(self):
        return self.created_at < timezone.now() - timedelta(hours=24)
    
    def __str__(self):
        return f"Token for {self.user.email}"

class BugReport(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low - Minor issue'),
        ('medium', 'Medium - Noticeable problem'),
        ('high', 'High - Major functionality broken'),
        ('critical', 'Critical - App unusable'),
    ]
    
    TYPE_CHOICES = [
        ('bug', 'Bug/Error'),
        ('ui', 'UI/Design Issue'),
        ('performance', 'Performance Issue'),
        ('feature', 'Feature Request'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    page_url = models.URLField(max_length=500)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    report_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='bug')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
  
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Bug Report"
        verbose_name_plural = "Bug Reports"
    
    def __str__(self):
        return f"{self.title} - {self.get_severity_display()}"

