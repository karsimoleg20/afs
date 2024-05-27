import datetime
from io import BytesIO
import base64
import os
import json

from django.urls import reverse
from django.shortcuts import render, redirect
from django.http.response import HttpResponse
from django.conf import settings
from pdf2image import convert_from_bytes
import requests

from .utils import read_help, Calculator


def select_workflow(request):
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    materials_dir = os.path.join(curr_dir, 'materials')

    help_dir = os.path.join(materials_dir, 'help')

    floor_area_help = ''
    with open(os.path.join(help_dir, 'workflows/floor_area'), 'r') as f:
        floor_area_help = f.read()
    
    floor_plan_help = ''
    with open(os.path.join(help_dir, 'workflows/floor_plan'), 'r') as f:
        floor_plan_help = f.read()
    
    context = {
        'floor_area_help': floor_area_help,
        'floor_plan_help': floor_plan_help,
    }

    return render(request, "calculator/select_workflow.html", context=context)


def filters(request):
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    materials_dir = os.path.join(curr_dir, 'materials')

    tree_path = os.path.join(materials_dir, 'tree.json')
    with open(tree_path, 'r') as f:
        tree = json.load(f)
    
    help_dir = os.path.join(materials_dir, 'help')
    read_help(help_dir, tree)

    price_path = os.path.join(materials_dir, 'price.json')
    with open(price_path, 'r') as f:
        price = json.load(f)

    context = {
        'tree': tree,
        'price': price,
    }

    return render(request, "calculator/filters.html", context=context)


def result(request):
    from django.http import HttpResponse, HttpResponseNotFound
    if request.method == 'POST':
        height = float(request.POST.get('height'))
        area = float(request.POST.get('area'))
        selection_list = json.loads(request.POST.get('selection_list'))

        calculator = Calculator(area, height, selection_list)
        calculations = calculator.calculate()

        calculations.update(
            {
                'height': height,
                'area': area,
            }
        )
        
        filters = calculator.humanize_filters()
        calculations.update(
            {
                'selection_chain': ' - '.join([v for k, v in filters.items()]),
            }
        )
        calculations_str = json.dumps(calculations)
        
        context = {
            **calculations,
            'calculations': calculations_str,
            'filters': filters,
        }

        return render(request, "calculator/result.html", context=context)
    return HttpResponseNotFound('<h1>Nothing here.</h1>')


def floor_area(request):
    context = {}

    return render(request, "calculator/floor_area.html", context=context)


def upload_floorplan(request):
    context = {}

    return render(request, 'calculator/upload_floorplan.html', context=context)


def room_selection(request):
    from django.http import HttpResponseNotFound
    if request.method == 'POST':
        img = request.FILES.get('image')
        scale = float(request.POST.get('scale'))

        # get image data
        fmt = str(img).split(".")[-1]
        if str(img).endswith('.pdf') or str(img).endswith('.PDF'):
            fmt = 'png'
            img = convert_from_bytes(img.read(), fmt=fmt)[0]
            with BytesIO() as f:
                img.save(f, format=fmt)
                f.seek(0)
                img_data = f.read()
        else:
            img_data = img.read()
        
        # process image (find rooms)
        res = requests.post(
            url=settings.IMAGE_PROCESSING_URI,
            data=img_data,
            headers={'Content-Type': 'application/octet-stream'}
        )
        
        errs = []
        img_src = None
        rooms = []
        if res.status_code != 200:
            errs.append('Unable to process given image. Try again.')
        else:
            # get room contours
            data = res.json()
            rooms = data.get('rooms')

            img_src = {
                'img': f'data:image/{fmt};base64,{base64.b64encode(img_data).decode("utf-8")}',
            }

        context = {
            'scale': scale,
            'rooms': rooms,
            'img_src': img_src,
            'errs': errs,
        }

        return render(request, 'calculator/room_selection.html', context=context)
    
    return HttpResponseNotFound('<h1>Nothing here.</h1>')


def upload_draw_over(request):
    context = {}

    return render(request, 'calculator/upload_draw_over.html', context=context)


def draw_over(request):
    from django.http import HttpResponseNotFound
    if request.method == 'POST':
        img = request.FILES.get('image')
        scale = float(request.POST.get('scale'))

        # get image data
        fmt = str(img).split(".")[-1]
        if str(img).endswith('.pdf') or str(img).endswith('.PDF'):
            fmt = 'png'
            img = convert_from_bytes(img.read(), fmt=fmt)[0]
            with BytesIO() as f:
                img.save(f, format=fmt)
                f.seek(0)
                img_data = f.read()
        else:
            img_data = img.read()
        
        errs = []
        img_src = None
        img_src = {
            'img': f'data:image/{fmt};base64,{base64.b64encode(img_data).decode("utf-8")}',
        }

        context = {
            'scale': scale,
            'img_src': img_src,
            'errs': errs,
        }

        return render(request, 'calculator/draw_over.html', context=context)
    
    return HttpResponseNotFound('<h1>Nothing here.</h1>')


def height(request):
    from django.http import HttpResponseNotFound
    if request.method == 'POST':
        selection_list = json.loads(request.POST.get('selection_list'))

        calculator = Calculator(10, 100, selection_list)
        calculations = calculator.calculate()
        
        filters = calculator.humanize_filters()

        context = {
            'filters': filters,
        }

        return render(request, 'calculator/height.html', context=context)

    return HttpResponseNotFound('<h1>Nothing here.</h1>')


def imitate_img_processing(request):
    from django.http import JsonResponse

    return JsonResponse(
        {
            "rooms": [
                [
                    [0.1, 0.1],
                    [0.3, 0.1],
                    [0.3, 0.4],
                    [0.15, 0.4],
                    [0.15, 0.3],
                    [0.1, 0.3],
                ],
                [
                    [0.1, 0.33],
                    [0.12, 0.33],
                    [0.12, 0.43],
                    [0.5, 0.43],
                    [0.5, 0.9],
                    [0.1, 0.9],
                ],
                [
                    [0.33, 0.1],
                    [0.9, 0.1],
                    [0.9, 0.4],
                    [0.33, 0.4],
                ],
                [
                    [0.53, 0.43],
                    [0.9, 0.43],
                    [0.9, 0.9],
                    [0.53, 0.9],
                ],
            ]
        }
    )


def contact(request):
    from django.http import HttpResponse, HttpResponseNotFound
    if request.method == 'POST':
        calculations = request.POST.get('calculations')

        message = ''
        if calculations:
            calculations = json.loads(calculations)
            curr_dir = os.path.dirname(os.path.abspath(__file__))
            materials_dir = os.path.join(curr_dir, 'materials')
            with open(os.path.join(materials_dir, 'contact_message_template'), 'r', encoding='utf-8') as f:
                msg_template = f.read()
            message = msg_template.format(**calculations)
        
        context = {
            'message': message,
            'selection_chain': calculations['selection_chain'],
        }

        return render(request, "calculator/contact.html", context=context)
    return HttpResponseNotFound('<h1>Nothing here.</h1>')
