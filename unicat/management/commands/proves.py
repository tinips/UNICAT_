import csv
import os
from django.core.management.base import BaseCommand
from unicat.models import Field_Study

# Script senzill per llegir i llistar els majors d'un fitxer CSV
class Command(BaseCommand):
    help = 'Llegeix i mostra la llista de majors des del fitxer majors-list.csv'

    def handle(self, *args, **options):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_file_path = os.path.join(current_dir, "majors-list.csv")

        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            list_of_majors = []
            for row in csv_reader:
                # Només afegeix si la columna existeix i té valor
                if 'Major_Category' in row and row['Major_Category'].strip():
                    major_name = row['Major_Category'].strip()
                    if major_name not in list_of_majors:
                        list_of_majors.append(major_name)
            # Mostra la llista final
            print(f"Total majors importats: {list_of_majors}")