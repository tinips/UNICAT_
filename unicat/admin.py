from django.contrib import admin
from .models import *



# Register the models
admin.site.register(User)
admin.site.register(Event)
admin.site.register(Resource)
admin.site.register(Comment)
admin.site.register(ErasmusParticipant)
admin.site.register(ErasmusProgram)
admin.site.register(Country)
admin.site.register(Profile)
admin.site.register(Field_Study)
admin.site.register(ErasmusReview)
admin.site.register(FavouriteErasmusProgram)
admin.site.register(EventParticipant)
admin.site.register(EmailVerificationToken)
admin.site.register(BugReport)