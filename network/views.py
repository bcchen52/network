import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator

from .models import User, Post, Profile


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)

        profile = Profile(user=user)
        profile.save()

        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
@login_required
def post(request):
    if request.method != "POST":
        return JsonResponse({"error": "Must be post."})
        
    data = json.loads(request.body)
    content = data.get("content", "")
    if content == "":
        return JsonResponse({
            "error": "Can't make empty post."
        }, status=400)
    post = Post(user=request.user, content=content)
    post.save()
    return JsonResponse({
            "message": "Posted!"
        }, status=200)

@csrf_exempt
@login_required
def get_post(request, id):
    try:
        post = Post.objects.get(id=id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post does not exist!"}, status=404)

    if request.method == "GET":
        return JsonResponse(post.serialize(), safe=False)

    #used to edit an existing post
    elif request.method == "PUT":
        data = json.loads(request.body)
        content = data.get("content", "")
        if content == "":
            return JsonResponse({
                "error": "Can't make empty post."
            }, status=400)
        post.content = data["content"]
        post.save()
        return JsonResponse({
            "message": "Post updated!"
        }, status=200)

    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

@login_required
def follow(request, username):
    #follow/unfollow a user
    try:
        user = User.objects.get(username=username)
        profile = Profile.objects.get(user=user)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    user_profile = Profile.objects.get(user=request.user)

    following = True
    
    #if already following
    if request.user in profile.followers.all():
        #remove follower remove following
        profile.followers.remove(request.user)
        user_profile.following.remove(user)
        following = False
    else:
        #add follower add following
        profile.followers.add(request.user)
        user_profile.following.add(user)

    profile.save()
    user_profile.save()

    response = profile.serialize()
    response["user_following"] = following
    
    return JsonResponse(response, safe=False)


def like(request, id):
    #like or unlike a post
    try:
        post = Post.objects.get(id=id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    
    if request.method == "GET":
        response = post.serialize()
        liked = True
        if request.user in post.likes.all():
            post.likes.remove(request.user)
            liked = False
        else:
            post.likes.add(request.user)

        post.save()
        response = post.serialize()
        response["user_liked"] = liked
        response["num_liked"] = post.likes.count()
        
        return JsonResponse(response)

def posts(request, posts_type, page):
    #loads posts depending on posts_type
    if posts_type == 'all':
        posts = Post.objects.all()

    elif posts_type == 'following':
        #get a user's following feed
        user = Profile.objects.get(user=request.user)
        if user.following.exists():
            posts = Post.objects.filter(user__in=user.following.all())
        else:
            return JsonResponse({"message": "Not following anyone. Follow someone to stay updated on their posts!"}, status=400)

    elif posts_type.isdigit():
        #get a certain user's posts
        try:
            user = User.objects.get(id=int(posts_type))
        except User.DoesNotExist:
            return JsonResponse({"error": "Invalid request."}, status=400)
        posts = Post.objects.filter(user=user)

    else:
        return JsonResponse({"error": "Invalid request."}, status=400)

    posts = posts.order_by("-timestamp").all()

    p=Paginator(posts, 10)
    #divide each "page" into 10 posts

    current_page = p.page(page)
    
    #if logged in, get info about whether user has liked posts or followed a user
    if request.user.is_authenticated:
        response = ()
        for post in current_page.object_list:
            new_list = list(response)
            new_post = post.serialize()
            #new_post is a dict
            
            #Either your post, and thus no follow button, else choice to follow/unfollow 
            if request.user != post.user:
                profile = Profile.objects.get(user=request.user)
                if post.user in profile.following.all():
                    new_post["to_follow"]="unfollow"
                else: 
                    new_post["to_follow"]="unfollow"
                    new_post["to_follow"]="follow"
            else:
                new_post["owned"]=True

            if request.user in post.likes.all():
                new_post["user_liked"] = True

            new_list.append(new_post)
            response=tuple(new_list)
        #return JsonResponse(response, safe=False)
    else:
        response = ([post.serialize() for post in current_page])
        #return JsonResponse([post.serialize() for post in current_page], safe=False)

    #add a dict to the json response with page info for displaying page numbers
    next = prev = fwd = bwd = False
    if current_page.has_next():
        next = current_page.next_page_number()
        if page < p.num_pages - 1:
            fwd = True

    if current_page.has_previous():
        prev = current_page.previous_page_number()
        if page > 2:
            bwd = True

    new_list = list(response)

    new_list.append({
        'next': next,
        'prev': prev,
        'fwd': fwd,
        'bwd': bwd,
        })

    response = tuple(new_list)

    return JsonResponse(response, safe=False)
    
def profile(request, user):
    try:
        user = User.objects.get(username=user)
    except User.DoesNotExist:
        return JsonResponse({"error": "User does not exist."}, status=400)

    profile = Profile.objects.get(user=user)
    response = profile.serialize()

    if request.user.is_authenticated:
        #by default, user_following is empty and no follow button shows up
        if user != request.user:
            if request.user in profile.followers.all():
                response["user_following"]="unfollow"
            else:
                response["user_following"]="follow"

    return JsonResponse(response)

#paginator