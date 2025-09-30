import logging
import os
from django.core.management.base import BaseCommand
from unicat.models import Event
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Delete expired events and their images from media folder'

    def handle(self, *args, **options):
        # Find expired events
        expired_events = Event.objects.filter(date__lt=timezone.now())
        total_count = expired_events.count()
        
        if total_count == 0:
            self.stdout.write(self.style.WARNING("No expired events found"))
            return
        
        deleted_images = 0
        failed_images = 0
        
        # Delete images and events
        for event in expired_events:
            # Delete image if exists
            if event.image:
                try:
                    image_name = event.image.name
                    image_path = event.image.path
                    
                    # Delete the physical file from media folder
                    event.image.delete(save=False)
                    
                    # Verify the file was actually deleted
                    if not os.path.exists(image_path):
                        deleted_images += 1
                        self.stdout.write(f"Deleted image: {image_name}")
                    else:
                        # If file still exists, try to delete it manually
                        try:
                            os.remove(image_path)
                            deleted_images += 1
                            self.stdout.write(f"Manually deleted image: {image_name}")
                        except OSError as os_error:
                            failed_images += 1
                            self.stdout.write(f"Failed to delete image file: {image_name} - {os_error}")
                            
                except Exception as e:
                    failed_images += 1
                    self.stdout.write(f"Failed to delete image for {event.title}: {e}")
            
            # Delete the event from database
            event.delete()
        
        # Show results
        self.stdout.write(self.style.SUCCESS(f"Deleted {total_count} expired events"))
        if deleted_images > 0:
            self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_images} images from media folder"))
        if failed_images > 0:
            self.stdout.write(self.style.WARNING(f"Failed to delete {failed_images} images"))