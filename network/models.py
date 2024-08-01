from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Profile(models.Model):
    user = models.OneToOneField(User, null=True, on_delete=models.CASCADE)
    following = models.ManyToManyField(User, null=True, blank=True, related_name="followers")
    followers = models.ManyToManyField(User, null=True, blank=True, related_name="following")

    def __str__(self):
        return self.user.username

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "email": self.user.email,
            "user_id": self.user.id,
            "following": [user.username for user in self.following.all()],
            "num_followers": self.followers.count(),
            "num_following": self.following.count(),
            "user_following": None,
        }

class Post(models.Model):
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    likes = models.ManyToManyField(User, blank=True, related_name="liker")
    content = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    edited_time = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s post {self.id}"

    def get_likes(self):
        likes_str = " like(s). Liked by"
        count = 0
        if self.likes.all().exists():
            for i in self.likes.all():
                count += 1
                likes_str += f" {i.username}"
                if count < self.likes.count():
                    likes_str += ","
                else:
                    likes_str += "."
            return likes_str
        else:
            return " likes."

    def serialize(self):
        timestamp = self.timestamp.strftime("%b %d %Y, %I:%M %p")
        if self.edited_time:
            edited = self.edited_time.strftime("%b %d %Y, %I:%M %p")
            if self.edited_time != self.timestamp:
                timestamp = f"{timestamp}. Last edited at {edited}"
        return {
            "id": self.id,
            "user": self.user.username,
            "content": self.content,
            "likes": self.get_likes(),
            "num_likes": self.likes.count(),
            "timestamp": timestamp,
            "user_liked": False,
            "owned": False,
            "to_follow": "None",
            "page_info": None,
        }