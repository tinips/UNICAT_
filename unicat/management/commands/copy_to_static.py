# unicat/management/commands/copy_to_static.py
import os
import shutil
from django.core.management.base import BaseCommand
from unicat.models import ErasmusProgram

class Command(BaseCommand):
    help = 'Copia imatges de media/ a static/ mantenint els noms originals'

    def handle(self, *args, **options):
        media_dir = 'media/erasmus_images'
        static_dir = 'unicat/static/unicat/images/erasmus'
        os.makedirs(static_dir, exist_ok=True)
        programs_with_image = ErasmusProgram.objects.exclude(image__isnull=True).exclude(image='')
        self.stdout.write(f"Trobats {programs_with_image.count()} programes amb imatges")
        copied = 0
        errors = 0
        for program in programs_with_image:
            try:
                if not program.image:
                    continue
                current_filename = os.path.basename(program.image.name)
                current_path = os.path.join(media_dir, current_filename)
                new_path = os.path.join(static_dir, current_filename)
                if os.path.exists(current_path):
                    shutil.copy2(current_path, new_path)
                    program.static_image = current_filename
                    program.save(update_fields=['static_image'])
                    self.stdout.write(f"Copiat: {program.university[:40]} -> {current_filename}")
                    copied += 1
                else:
                    self.stdout.write(f"Fitxer no trobat: {current_path}")
                    errors += 1
            except Exception as e:
                self.stdout.write(f"Error amb {program.university}: {str(e)}")
                errors += 1
        self.stdout.write(self.style.SUCCESS(f"\n🎉 RESULTAT:"))
        self.stdout.write(f"Copiades: {copied} imatges")
        self.stdout.write(f"Errors: {errors}")
        self.stdout.write(f"Destinació: {static_dir}")
        total_programs = ErasmusProgram.objects.count()
        with_static = ErasmusProgram.objects.exclude(static_image__isnull=True).exclude(static_image='').count()
        with_media = ErasmusProgram.objects.exclude(image__isnull=True).exclude(image='').count()
        self.stdout.write(f"\nESTAT FINAL:")
        self.stdout.write(f"Total programes: {total_programs}")
        self.stdout.write(f"Amb imatge estàtica: {with_static}")
        self.stdout.write(f"Amb imatge media: {with_media}")