from .settings import *

DEBUG = False

# image processing URI
IMAGE_PROCESSING_URI = os.environ.get('IMAGE_PROCESSING_URI')

# Configure default domain name
ALLOWED_HOSTS = [os.environ['WEBSITE_NAME'] + '.azurewebsites.net', '127.0.0.1'] if 'WEBSITE_NAME' in os.environ else []
if os.environ.get('BASE_HOST'):
    ALLOWED_HOSTS += [os.environ['BASE_HOST'], ]

# security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
BASE_URL = f'https://{os.environ["BASE_HOST"]}'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# WhiteNoise configuration
MIDDLEWARE = [                                                                   
    'django.middleware.security.SecurityMiddleware',
    # Add whitenoise middleware after the security middleware                             
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',                      
    'django.middleware.common.CommonMiddleware',                                 
    # 'django.middleware.csrf.CsrfViewMiddleware',                                 
    'django.contrib.auth.middleware.AuthenticationMiddleware',                   
    'django.contrib.messages.middleware.MessageMiddleware',                      
    'django.middleware.clickjacking.XFrameOptionsMiddleware',                    
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

INSTALLED_APPS = [
    app if app != 'django.contrib.staticfiles' else 'whitenoise.runserver_nostatic'
    for app in INSTALLED_APPS
]
