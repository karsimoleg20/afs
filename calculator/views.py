from io import BytesIO
import base64

from django.shortcuts import render
from django.http.response import HttpResponseNotFound
from django.conf import settings
from pdf2image import convert_from_bytes
import requests


def select_workflow(request):    
    context = {
        'floor_area_help': 'Provide the total area along with the height of the finished floor and receive the price estimation.',
        'floor_plan_help': 'Upload the floor plan and allow our state of the art AI based system to guide you through the estimation process.',
    }

    return render(request, "calculator/select_workflow.html", context=context)


def flooring_type(request):
    return render(request, "calculator/flooring_type.html")


def result(request):
    if request.method == 'POST':
        flooring_type = request.POST.get('flooring_type')
        area = float(request.POST.get('area'))
        
        labor_per_meter = 5
        material_price_per_meter = 20

        if flooring_type == 'parquet':
            material_price_per_meter = 50
        elif flooring_type == 'laminate':
            material_price_per_meter = 30
        elif flooring_type == 'tiles':
            material_price_per_meter = 60
        elif flooring_type == 'epoxy':
            material_price_per_meter == 20
        elif flooring_type == 'linoleum':
            material_price_per_meter = 10
        
        material_price = material_price_per_meter * area
        labor_price = labor_per_meter * area
        total_price = material_price + labor_price
        price_per_meter = material_price_per_meter + labor_per_meter
        
        context = {
            'supply_only': material_price,
            'labor_price': labor_price,
            'supply_install': total_price,
            'supply_only': material_price,
            'price_per_m2_supp_inst': price_per_meter,
            'price_per_m2_supp_only': material_price_per_meter,
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
