from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static


from . import views

urlpatterns = [
    path('', views.select_workflow, name='select_workflow'),
    path('upload_floorplan', views.upload_floorplan, name='upload_floorplan'),
    path('room_selection', views.room_selection, name='room_selection'),
    path('upload_draw_over', views.upload_draw_over, name='upload_draw_over'),
    path('draw_over', views.draw_over, name='draw_over'),
    path('floor_area', views.floor_area, name='floor_area'),
    path('flooring_type', views.flooring_type, name='flooring_type'),
    path('result', views.result, name='result'),
]
