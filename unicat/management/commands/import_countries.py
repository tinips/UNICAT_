import os
from django.core.management.base import BaseCommand
from django.conf import settings
from unicat.models import Country
import csv

class Command(BaseCommand):
    help = 'Importa països des d\'un fitxer CSV'
    Country.objects.all().delete()  # Esborra les dades existents abans d'importar

    def handle(self, *args, **options):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_file_path = os.path.join(current_dir, "countries.csv")

        try:
            with open(csv_file_path, newline='', encoding='utf-8') as fh:
                reader = csv.DictReader(fh)
                new = []
                for row in reader:
                    # Si el país ja existeix, no l'afegeix
                    if Country.objects.filter(code=row['alpha-2']).exists():
                        self.stdout.write(f"País ja existeix: {row['name']}")
                        continue
                    new.append(Country(
                        name=row['name'].strip(),
                        code=row['alpha-2'].strip(),
                    ))
                Country.objects.bulk_create(new)
                self.stdout.write(self.style.SUCCESS(f"Importats {len(new)} països nous"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error llegint el fitxer: {e}"))
            raise e
