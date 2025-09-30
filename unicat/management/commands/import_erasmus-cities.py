import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service 
from webdriver_manager.chrome import ChromeDriverManager
import requests
from unicat.models import ErasmusProgram
import time

from django.core.management.base import BaseCommand
import os
import csv


class Command(BaseCommand):
    help = 'Importa ciutats de les universitats des de QS Rankings i les associa amb els programes existents'

    def handle(self, *args, **options):
        ErasmusProgram.objects.all().update(city=None)  # Esborra les ciutats existents

        for i in range(1,12):
            url=f"https://www.topuniversities.com/world-university-rankings?page={i}&items_per_page=150"
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')

            options = webdriver.ChromeOptions()
            options.add_argument('--headless')
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
            driver.get(url)
            time.sleep(5)
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, "html.parser")
            driver.quit()
            location_divs = soup.find_all('div', class_='location')
            self.stdout.write(f"Divs de localització trobats a la pàgina {i}: {len(location_divs)}")
            offset = (i - 1) * 150
            for j, div in enumerate(location_divs):
                item_index = offset + j + 1
                self.stdout.write(f"Processant item index {item_index}")
                try:
                    program = ErasmusProgram.objects.get(index=item_index)
                    if item_index == 324:
                        city="Miami"
                        program.city = "Miami"
                        self.stdout.write(self.style.SUCCESS(
                            f"Actualitzat programa #{item_index}: {program.university} amb ciutat: {city}"
                        ))
                        program.save()
                    elif item_index == 205:
                        city="Paris"
                        program.city = "Paris"
                        self.stdout.write(self.style.SUCCESS(
                            f"Actualitzat programa #{item_index}: {program.university} amb ciutat: {city}"
                        ))
                        program.save()
                    else:
                        location_text = div.get_text(strip=True)
                        location_text = ' '.join(location_text.split())
                        if ',' in location_text:
                            city = location_text.split(',')[0].strip()
                        else:
                            city = location_text
                        program.city = city
                        program.save()
                        self.stdout.write(self.style.SUCCESS(
                            f"Actualitzat programa #{item_index}: {program.university} amb ciutat: {city}"
                        ))
                except ErasmusProgram.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f"No s'ha trobat programa amb index {item_index}"
                    ))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f"Error actualitzant programa #{item_index}: {str(e)}"
                    ))

