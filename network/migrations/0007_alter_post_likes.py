# Generated by Django 5.0.6 on 2024-07-18 08:03

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0006_alter_post_edited_time'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='likes',
            field=models.ManyToManyField(blank=True, related_name='liker', to=settings.AUTH_USER_MODEL),
        ),
    ]
