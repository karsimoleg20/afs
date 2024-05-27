# AFS

Floor calculator with AI room recognition.

# Installation

Create a virtual environment (python 3.7 is recomended):

```
python3 -m venv env
```

Activate virtual environment:

- Mac/Linux: `source ./env/bin/activate`
- Windows: `.\env\Scripts\activate`

Install dependencies:

```
pip install -r requirements.txt
```

# Run locally

Run the following command (in virtual enviroment) to start the server:

```
python manage.py runserver
```

# Run using Docker

## Build 

`docker build -t karsimoleg20/afs .`

## Run

`docker run -it -d --net=host karsimoleg20/afs`

## Codespaces

`docker run -it -d -e IMAGE_PROCESSING_URI="<image-processing-uri>" --net=host karsimoleg20/afs`

You can get `IMAGE_PROCESSING_URI` after starting afs-ml app in corresponding codespace.
