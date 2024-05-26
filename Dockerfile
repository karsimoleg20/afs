FROM python:3.9.6

WORKDIR /app
COPY . .
RUN pip install -U pip setuptools wheel
RUN pip install -r requirements.txt

ENTRYPOINT ["python", "manage.py", "runserver", "0.0.0.0:80"]
