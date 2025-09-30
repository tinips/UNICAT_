import os
import csv
import time
from django.core.management.base import BaseCommand
from django.db.models import Q
from unicat.models import Country, ErasmusProgram

class Command(BaseCommand):
    help = 'Importa programes Erasmus des d\'un fitxer CSV eliminant els camps no vàlids'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-file',
            type=str,
            help='Ruta absoluta al fitxer CSV',
            required=True
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Esborra tots els programes existents abans d\'importar'
        )

    def handle(self, *args, **options):
        ErasmusProgram.objects.all().delete()  # Esborra tots els programes existents si --clear és True
        csv_file_path = options['csv_file']
        
        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f"El fitxer {csv_file_path} no existeix"))
            return
            
        if options['clear']:
            if input("Estàs segur que vols esborrar tots els programes? (s/n): ").lower() == 's':
                ErasmusProgram.objects.all().delete()
                self.stdout.write(self.style.SUCCESS("S'han esborrat tots els programes"))
        
        self.import_from_csv(csv_file_path)
    
    def import_from_csv(self, csv_file_path):
        created = 0
        updated = 0
        errors = 0
        
        try:
            with open(csv_file_path, 'r', encoding='utf-8-sig') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for row in reader:
                    try:
                        # Obtenir el nom de la universitat
                        uni_name = row.get('institution', '').strip()
                        if not uni_name:
                            self.stdout.write(self.style.WARNING("Fila sense nom d'universitat, saltant..."))
                            continue
                        
                        # Comprovar si ja existeix
                        existing = ErasmusProgram.objects.filter(university__iexact=uni_name).first()
                        
                        # Preparar les dades filtrant els camps no vàlids
                        program_data = self.prepare_program_data(row)
                        
                        if existing:
                            # Actualitzar només els camps que no siguin None
                            for key, value in program_data.items():
                                if value is not None:
                                    setattr(existing, key, value)
                            existing.save()
                            self.stdout.write(f"Actualitzat: {uni_name}")
                            updated += 1
                        else:
                            # Crear nou programa
                            program = ErasmusProgram(**program_data)
                            program.save()
                            self.stdout.write(f"Creat: {uni_name}")
                            created += 1
                            
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Error processant {row.get('institution', 'Desconeguda')}: {str(e)}"))
                        errors += 1
            
            self.stdout.write(self.style.SUCCESS(
                f"Importació completada: {created} creats, {updated} actualitzats, {errors} errors"
            ))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error obrint el fitxer CSV: {str(e)}"))
    
    def prepare_program_data(self, row):
        """
        Prepara les dades filtrant els camps no vàlids i fent les conversions necessàries
        """
        # Mapeig de camps del CSV als camps del model
        field_mapping = {
            "INDEX": "index",
            'institution': 'university',
            'rank display': 'rank',
            'location code': 'country_code',
            'size': 'size',
            'focus': 'focus',
            'research': 'research',
            'status': 'status',
            'ar score': 'ar_score',
            'ar rank': 'ar_rank',
            'er score': 'er_score',
            'er rank': 'er_rank',
            'fsr score': 'fsr_score',
            'fsr rank': 'fsr_rank',
            'cpf score': 'cpf_score',
            'cpf rank': 'cpf_rank',
            'ifr score': 'ifr_score',
            'ifr rank': 'ifr_rank',
            'isr score': 'isr_score',
            'isr rank': 'isr_rank',
            'irn score': 'irn_score',
            'irn rank': 'irn_rank',
            'ger score': 'ger_score',
            'ger rank': 'ger_rank',
            'SUS SCORE': 'sus_score',
            'SUS RANK': 'sus_rank',
            'Overall Score': 'overall_score'
        }
        
        # Camps numèrics que necessiten conversió
        numeric_fields = [
            'ar_score', 'er_score', 'fsr_score', 'cpf_score',
            'ifr_score', 'isr_score', 'irn_score', 'ger_score',
            'sus_score', 'overall_score'
        ]
        
        # Preparar les dades
        program_data = {}
        
        for csv_field, model_field in field_mapping.items():
            if csv_field in row:
                # Tractar el país com a cas especial
                if model_field == 'country_code' and row[csv_field]:
                    try:
                        country = Country.objects.get(code=row[csv_field])
                        program_data[model_field] = country
                    except Country.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"País no trobat: {row[csv_field]}"))
                        program_data[model_field] = None
                
                # Tractar camps numèrics
                elif model_field in numeric_fields:
                    try:
                        value = row[csv_field].strip()
                        if value == '':
                            program_data[model_field] = None
                        else:
                            program_data[model_field] = float(value)
                    except (ValueError, TypeError):
                        program_data[model_field] = None
                
                # Resta de camps
                else:
                    program_data[model_field] = row[csv_field] if row[csv_field] != '' else None
        
        return program_data