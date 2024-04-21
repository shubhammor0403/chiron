from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/fetch-calories/', views.fetch_calories, name='fetch-calories'),
    path('api/fetch-week-data/', views.fetch_week_data, name='fetch-week-data'),
    path('api/delete-calories/', views.delete_calories, name='delete-calories'),
    path('api/fetch-suggestions/', views.fetch_suggestions, name='fetch-suggestions'),
    path('api/delete-individual/', views.delete_individual, name='delete-individual'),
    
    
]