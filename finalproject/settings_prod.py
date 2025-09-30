from .settings import *
from decouple import config
import os

DEBUG = False

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '13.53.176.32',
    'unicat-app.ddns.net',        
    'www.unicat-app.ddns.net',    
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='unicat_db'),
        'USER': config('DB_USER', default='unicat_user'),
        'PASSWORD': config('DB_PASSWORD', default='change_this_password'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

SESSION_COOKIE_SECURE = False     
CSRF_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')  

MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='unicat.noreply@gmail.com')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='change_this_password')
DEFAULT_FROM_EMAIL = 'UniCat <unicat.noreply@gmail.com>'

SITE_URL = config('SITE_URL', default='http://unicat-app.ddns.net')

AUTHORIZED_EVENT_CREATOR_EMAILS = [
    'albert.arboles06@gmail.com'
]

BUG_REPORT_EMAIL = config('BUG_REPORT_EMAIL', default='unicat.noreply@gmail.com')

DATE_FORMAT = 'd/m/Y'
DATETIME_FORMAT = 'd/m/Y H:i'
TIME_FORMAT = 'H:i'