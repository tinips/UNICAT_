from django.core.management.base import BaseCommand
from django.db import transaction
from unicat.models import Country, ErasmusProgram


class Command(BaseCommand):
    help = 'Elimina països sense programes Erasmus associats'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostra quins països s\'eliminarien sense eliminar-los realment',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força l\'eliminació sense demanar confirmació',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        self.stdout.write(
            self.style.SUCCESS('Buscant països sense programes Erasmus...')
        )
        
        # Cerca països sense cap programa Erasmus
        countries_without_programs = Country.objects.filter(
            erasmusprogram__isnull=True
        ).distinct()
        
        total_countries = Country.objects.count()
        useless_countries_count = countries_without_programs.count()
        
        if useless_countries_count == 0:
            self.stdout.write(
                self.style.SUCCESS('Tots els països tenen almenys un programa Erasmus.')
            )
            return
        
        self.stdout.write(
            self.style.WARNING(f'S\'han trobat {useless_countries_count} països sense programes Erasmus de {total_countries} països totals.')
        )
        self.stdout.write('\nPaïsos que s\'eliminarien:')
        for country in countries_without_programs:
            self.stdout.write(f'   {country.name} ({country.code})')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\nDRY RUN: No s\'ha eliminat cap país.')
            )
            self.stdout.write(
                self.style.SUCCESS(f'S\'eliminarien {useless_countries_count} països.')
            )
            return
        
        # Confirmació abans d'eliminar (si no s'ha forçat)
        if not force:
            self.stdout.write(
                self.style.WARNING(f'\nAixò eliminarà definitivament {useless_countries_count} països!')
            )
            confirmation = input('Segur que vols continuar? (sí/no): ')
            if confirmation.lower() not in ['sí', 'si', 's']:
                self.stdout.write(
                    self.style.ERROR('Operació cancel·lada per l\'usuari.')
                )
                return
        
        # Elimina països dins d'una transacció
        try:
            with transaction.atomic():
                deleted_countries = []
                for country in countries_without_programs:
                    deleted_countries.append(f'{country.name} ({country.code})')
                deleted_count, _ = countries_without_programs.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'\nEliminats {deleted_count} països:')
                )
                for country_info in deleted_countries:
                    self.stdout.write(f'   {country_info}')
                remaining_countries = Country.objects.count()
                self.stdout.write(
                    self.style.SUCCESS(f'\nEstadístiques finals:')
                )
                self.stdout.write(f'   Països eliminats: {deleted_count}')
                self.stdout.write(f'   Països restants: {remaining_countries}')
                self.stdout.write(f'   Total programes Erasmus: {ErasmusProgram.objects.count()}')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error durant l\'eliminació: {str(e)}')
            )
            raise

    def get_version(self):
        return "1.0.0"