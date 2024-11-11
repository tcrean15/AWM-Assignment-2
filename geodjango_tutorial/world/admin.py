from django.contrib.gis import admin

from .models import WorldBorder, Profile, LocationNote, NoteComment

admin.site.register(WorldBorder, admin.GISModelAdmin)
admin.site.register(Profile, admin.GISModelAdmin)
admin.site.register(LocationNote, admin.GISModelAdmin)
admin.site.register(NoteComment, admin.ModelAdmin)
