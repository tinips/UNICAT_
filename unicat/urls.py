from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    # Email verification URLs
    path('verify-email/<uuid:token>/', views.verify_email, name='verify_email'),
    path('register-success/', views.register_success, name='register_success'),
    path('resend-verification/', views.resend_verification, name='resend_verification'),
    
    path("home", views.home, name="home"),
    
    # Event URLs
    path("events", views.events, name="events"),
    path("events/create", views.create_event, name="create_event"),
    path("events/<int:event_id>", views.event_detail, name="event_detail"),
    path("events/<int:event_id>/edit", views.edit_event, name="edit_event"),
    path("events/<int:event_id>/delete", views.delete_event, name="delete_event"),
    #  New event participation URLs
    path("events/<int:event_id>/join/", views.join_event, name="join_event"),
    path("events/<int:event_id>/leave/", views.leave_event, name="leave_event"),
    
    # API endpoints
    path("api/events", views.get_events, name="get_events"),

    path("exchanges_form/<int:program_id>/", views.erasmus_form, name="exchanges_form_with_program"),
    path("exchanges_form/<int:program_id>/<int:main>/", views.erasmus_form, name="exchanges_form_with_program"),
    path("exchanges_detail/<int:program_id>/", views.erasmus_detail, name="exchanges_detail"),
    path("exchanges/", views.erasmus, name="exchanges"),
    path("resources", views.resources, name="resources"),
    path("resources/<int:resource_id>/", views.resource_detail, name="resource_detail"),
    path("resources/<int:resource_id>/comment/", views.add_comment, name="add_comment"),
    path("get_resources/", views.get_resources, name="get_resources"),
    path("edit_resource/<int:resource_id>/<int:main>/", views.edit_resource, name="edit_resource"),
    path("delete_resource/<int:resource_id>/", views.delete_resource, name="delete_resource"),
    path("profile/edit/", views.edit_profile, name="edit_profile"),
    path("profile/", views.profile_view, name="profile"),
    path("profile/<str:username>/", views.profile_view, name="user_profile"),
    path('edit_comment/<int:resource_id>/comment/<int:comment_id>/', views.edit_comment, name='edit_comment'),
    path('edit_comment/<int:resource_id>/reply/<int:comment_id>/', views.edit_comment, name='edit_reply'),
    path('delete_comment/<int:resource_id>/comment/<int:comment_id>/', views.delete_comment, name='delete_comment'),
    path('delete_comment/<int:resource_id>/reply/<int:comment_id>/', views.delete_comment, name='delete_reply'),
    path("exchanges_add_review/<int:program_id>/", views.add_erasmus_review, name="exchanges_add_review"),
    path("api/erasmus-programs/", views.get_erasmus_programs, name="api_erasmus_programs"),
    path('erasmus/<int:program_id>/toggle-favorite/', views.toggle_favorite_erasmus, name='toggle_favorite_erasmus'),
    path('erasmus/<int:program_id>/disconnect/', views.disconnect_erasmus, name='disconnect_erasmus'),
    path('submit-bug-report/', views.submit_bug_report, name='submit_bug_report'),
]