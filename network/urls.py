
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    #API Paths
    path("posts/<str:posts_type>/<int:page>", views.posts, name="posts"),
    path("profile/<str:user>", views.profile, name="profile"),
    path("post", views.post, name="post"),
    path("post/<int:id>", views.get_post, name="get_post"),
    path("like/<int:id>", views.like, name="like"),
    path("follow/<str:username>", views.follow, name="follow"),
]
