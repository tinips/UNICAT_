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
import re
import time
import requests
from urllib.parse import urlparse, unquote
from django.core.files.base import ContentFile
import os.path


class Command(BaseCommand):
    help = 'Importa logos de les universitats des de QS Rankings i els associa amb les universitats existents'

    def handle(self, *args, **options):

        media_dir = 'media/erasmus_images'
        os.makedirs(media_dir, exist_ok=True)  # Asegurar que el directorio existe
       
        
        # Cantidad de universidades por página
        items_per_page = 150
        
        # Orden explícito por índice
        university_list = ErasmusProgram.objects.all().order_by('index')
        
        for i in range(1, 12):
            # Calcular el offset correcto basado en el número de página
            offset = (i - 1) * items_per_page
            
            self.stdout.write(self.style.SUCCESS(f'Procesando página {i} (índices {offset+1}-{offset+items_per_page})'))
            
            url = f"https://www.topuniversities.com/world-university-rankings?page={i}&items_per_page={items_per_page}"
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')

            options = webdriver.ChromeOptions()
            options.add_argument('--headless')
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
            driver.get(url)

            # Wait for JavaScript to load content
            time.sleep(5)

            # Get the page source after JavaScript execution
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, "html.parser")
            driver.quit()

            spans = soup.find_all('span', class_='logo-wrapper new-rank')
            self.stdout.write(self.style.SUCCESS(f'Encontrados {len(spans)} logos en la página'))
            print(len(spans))
            z=0
            for j in range(150):
            
                # Calcular el índice correcto para cada universidad
                university_index = offset + j + 1
                
                self.stdout.write(f'Procesando universidad #{university_index}')
                
                # Casos especiales
                if university_index == 205:
                    img_url = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeGJfbCGb8HvWcC5vQmuGNTF2AZb1q0NyzkQ&s"
                elif university_index == 324:
                    img_url = "https://logos-world.net/wp-content/uploads/2022/02/University-Of-Miami-Symbol.png"
                elif university_index == 1288:
                    img_url = "https://upload.wikimedia.org/wikipedia/en/thumb/d/d9/Shahjalal_University_of_Science_and_Technology_logo.png/250px-Shahjalal_University_of_Science_and_Technology_logo.png"                
                else:
                    if university_index == 399:
                        link_element = spans[z+1].find('a')
                    elif university_index == 400:
                        link_element = spans[z-1].find('a')
                    elif university_index == 1504:
                        break
                    else:
                        link_element = spans[z].find('a')
                    # Get university link and name
                    z+=1
                    if link_element:
                        img = link_element.find('img')
                        if img and img.get('src'):
                            img_url = img.get('src')
                            print(img_url)

                        else:
                            self.stdout.write(self.style.WARNING(f"⚠️ No se encontró imagen para universidad #{university_index}"))
                            continue
                    else:
                        self.stdout.write(self.style.WARNING(f"⚠️ No se encontró enlace para universidad #{university_index}"))
                        continue
                
                try:
                    # Obtener el programa correcto usando el índice calculado
                    program = ErasmusProgram.objects.get(index=university_index)
                    
                    # Procesar la imagen
                    parsed_url = urlparse(img_url)
                    file_name = os.path.basename(unquote(parsed_url.path))
                    
                    # Si el nombre del archivo es vacío o demasiado corto, usar un nombre basado en la universidad
                    if not file_name or len(file_name) < 5:
                        file_name = f"uni_{university_index}.jpg"
                        
                    file_path = os.path.join(media_dir, file_name)
                    
                    try:
                        response = requests.get(img_url, stream=True)
                        response.raise_for_status()  # Verificar si hay errores HTTP
                        
                        if response.status_code == 200:
                            with open(file_path, 'wb') as img_file:
                                for chunk in response.iter_content(1024):
                                    img_file.write(chunk)

                            relative_path = os.path.join('erasmus_images', file_name)
                            program.image = relative_path
                            program.save()
                            self.stdout.write(self.style.SUCCESS(f"✓ Guardat logo per a {program.university}"))
                        else:
                            self.stdout.write(self.style.WARNING(f"⚠️ Error {response.status_code} descarregant {img_url}"))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"❌ Error descargando imagen: {str(e)}"))
                        
                except ErasmusProgram.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"⚠️ No existe programa con índice {university_index}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"❌ Error procesando universidad #{university_index}: {str(e)}"))
                
                