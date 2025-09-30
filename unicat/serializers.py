from rest_framework import serializers

from .models import *

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'user', 'text', 'created_at']


class ResourceSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    was_edited = serializers.BooleanField(read_only=True)
    edit_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Resource
        fields = ['id', 'user', 'document', 'description', 'type', 'timestamp', 
                 'updated_at', 'field_of_study', 'comments', 'user_username', 
                 'was_edited', 'edit_display']

class EventSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    program_file_url = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()
    university_display = serializers.CharField(source='get_university_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    date_formatted = serializers.SerializerMethodField()
    time_formatted = serializers.SerializerMethodField()
    has_inscription_link = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    is_user_participating = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
    
    def get_program_file_url(self, obj):
        if obj.program_file:
            return obj.program_file.url
        return None
    
    def get_participants_count(self, obj):
        return obj.get_participants_count()
    
    def get_date_formatted(self, obj):
        return obj.date.strftime('%d %B, %Y')
    
    def get_time_formatted(self, obj):
        return obj.date.strftime('%I:%M %p')
    
    def get_has_inscription_link(self, obj):
        return bool(obj.inscription_link)
    
    def get_is_user_participating(self, obj):
        """Check if the current user is participating in this event"""
        context = self.context
        user_participating_events = context.get('user_participating_events', set())
        return obj.id in user_participating_events
    
    def validate_date(self, value):
        """Validate that the event date is in the future"""
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Event date and time must be in the future.")
        return value

# Add this serializer for Erasmus programs

class ErasmusProgramSerializer(serializers.ModelSerializer):
    country = serializers.CharField(source='country_code.name')
    is_connected = serializers.SerializerMethodField()
    full_stars = serializers.SerializerMethodField()
    has_half_star = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    is_user_program = serializers.SerializerMethodField()
    has_user_program = serializers.SerializerMethodField()
    
    class Meta:
        model = ErasmusProgram
        fields = ['id', 'university', 'city', 'country', 'rank', 'static_image', 
                 'is_connected', 'full_stars', 'has_half_star', 
                 'average_rating', 'reviews_count', 'participants_count',
                 'is_favorite', 'is_user_program', 'has_user_program']
    
    def get_is_connected(self, obj):
        user_program_ids = self.context.get('user_program_ids', set())
        return obj.id in user_program_ids
    
    def get_full_stars(self, obj):
        avg = obj.average_rating() or 0
        return int(avg)
    
    def get_has_half_star(self, obj):
        avg = obj.average_rating() or 0
        return (avg - int(avg)) >= 0.5
    
    def get_reviews_count(self, obj):
        return obj.reviews.count()
    
    def get_participants_count(self, obj):
        return obj.participants.count()
    
    def get_average_rating(self, obj):
        return obj.average_rating() or 0
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user_favorites = self.context.get('user_favorites', [])
            return obj.id in user_favorites
        return False
    
    def get_is_user_program(self, obj):
        """Check if this program is the user's current program"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                user_participant = ErasmusParticipant.objects.get(user=request.user)
                return user_participant.program == obj
            except ErasmusParticipant.DoesNotExist:
                return False
        return False
    
    def get_has_user_program(self, obj):
        """Check if user has any program (different from this one)"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ErasmusParticipant.objects.filter(user=request.user).exists()
        return False