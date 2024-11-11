from django.urls import path
from django.shortcuts import redirect
from world.views import index, login_view, logout_view, update_location, signup_view
from . import views

print("Loading world.urls module")

def redirect_to_login(request):
    return redirect('login')

urlpatterns = [
    path('', redirect_to_login, name='home'),
    path('map/', index, name='index'),
    path('login/', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('logout/', logout_view, name='logout'),
    path('update_location/', update_location, name='update_location'),
    path('get-notes/', views.get_notes, name='get_notes'),
    path('add_note/', views.add_note, name='add_note'),
    path('delete_note/<int:note_id>/', views.delete_note, name='delete_note'),
    path('add_comment/<int:note_id>/', views.add_comment, name='add_comment'),
    path('delete_comment/<int:comment_id>/', views.delete_comment, name='delete_comment'),
    path('edit_note/<int:note_id>/', views.edit_note, name='edit_note'),
    path('set_location/', views.set_location, name='set_location'),
] 