import csv
import os
from django.core.management.base import BaseCommand
from unicat.models import Field_Study

class Command(BaseCommand):
    help = 'Importa camps d\'estudi des del fitxer majors-list.csv'

    def handle(self, *args, **options):
        Field_Study.objects.all().delete()  # Esborra les entrades existents abans d'importar
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_file_path = os.path.join(current_dir, "majors-list.csv")

        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                imported_count = 0
                skipped_count = 0
                for row in csv_reader:
                    # Només afegeix si la columna existeix i té valor
                    if 'Major_Category' in row and row['Major_Category'].strip():
                        major_name = row['Major_Category'].strip()
                        if major_name == "N/A (less than bachelor's degree)":
                            continue
                        exists = Field_Study.objects.filter(name=major_name).exists()
                        if exists:
                            self.stdout.write(f"Camp d'estudi ja existeix: {major_name}")
                            skipped_count += 1
                        else:
                            if major_name == "NA":
                                continue
                            else:
                                Field_Study.objects.create(name=major_name)
                                self.stdout.write(f"Afegit camp d'estudi: {major_name}")
                                imported_count += 1
                Field_Study.objects.create(name="Other")
                self.stdout.write(self.style.SUCCESS(
                    f"Importats {imported_count} camps d'estudi (s\'han saltat {skipped_count} duplicats)"
                ))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"Fitxer no trobat: {csv_file_path}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error llegint el fitxer: {e}"))
            raise e