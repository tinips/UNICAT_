from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('unicat', '0001_initial'),  # Asegúrate de que esto apunte a tu última migración
    ]

    operations = [
        migrations.AddField(
            model_name='field_study',
            name='order',
            field=models.IntegerField(default=0),
        ),
    ]