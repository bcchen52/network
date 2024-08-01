document.addEventListener('DOMContentLoaded', function() {
    all_posts();
    document.querySelector('#view-posts').addEventListener('click', () => all_posts());
    document.querySelector('#following-posts').addEventListener('click', () => following_posts());
    document.querySelector('#post-form').onsubmit = post;
    document.querySelector('#profile-self').addEventListener('click', (event) => {
        load_profile(document.querySelector('#username').value);
    });
    document.querySelector('#message').addEventListener('click', () => {
        document.querySelector('#message').style.display = 'none';
    });
});

function all_posts(){
    //display all posts
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#posts-title').style.display = 'block';
    document.querySelector('#following-title').style.display = 'none';
    document.querySelector('#message').style.display = 'none';

    load_posts('all', 1);
}

function load_profile(user) {
    //display a user's profile
    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#posts-title').style.display = 'none';
    document.querySelector('#message').style.display = 'none';
    document.querySelector('#following-title').style.display = 'none';

    fetch(`/profile/${user}`)
    .then(response => response.json())
    .then(profile => {
        document.querySelector('#profile-view').innerHTML = 
        `<h2>${profile.user}</h2>
        <div class="container" id="profile-container">
            <div class="d-flex justify-content-center">${profile.email}</div>
            <div id="follower_status"><strong>${profile.user}</strong> has <strong>${profile.num_followers}</strong> follower(s). <strong>${profile.user}</strong> is following <strong>${profile.num_following}</strong> people.</div>
        </div>`;

        const profile_container = document.querySelector("#profile-container");

        //follow button
        if (profile.user_following) {
            console.log(profile.user_following);
            const profile_follow_button = document.createElement('button');
            profile_follow_button.setAttribute('class', 'btn btn-outline-dark btn-block');
    
            if (profile.user_following === 'follow') {
                profile_follow_button.innerHTML = "Follow"; 
            } else {
                profile_follow_button.innerHTML = "Unfollow"; 
            }

            profile_follow_button.onclick = () => {
                fetch(`follow/${profile.user}`)
                .then(response => response.json())
                .then(profile2 => {
                    if (profile2.user_following) {
                        profile_follow_button.innerHTML = "Unfollow"; 
                    } else {
                        profile_follow_button.innerHTML = "Follow"; 
                    }
                    console.log(profile2.num_followers);

                    const following_status = document.querySelector("#follower_status");
                    console.log(following_status.innerHTML);
                    following_status.innerHTML = `<strong>${profile2.user}</strong> has <strong>${profile2.num_followers}</strong> follower(s). <strong>${profile2.user}</strong> is following <strong>${profile2.num_following}</strong> people.`;
                });
            }

            profile_container.appendChild(profile_follow_button);
        }

        profile_container.appendChild(document.createElement('hr'));

        load_posts(profile.user_id, 1);
    });
}

function following_posts(){
    //display following feed
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#posts-title').style.display = 'none';
    document.querySelector('#following-title').style.display = 'block';
    document.querySelector('#message').style.display = 'none';
    document.querySelector('#following-title').innerHTML = `<h2>Following</h2>`;

    load_posts('following', 1);
}

function post() {
    //create a post
    fetch('/post', {
        method: 'POST',
        body: JSON.stringify({
          content: document.querySelector('#compose-content').value,
        })
      })
      .then( response => response.json())
      .then( result => {
        document.querySelector('#message').style.display = 'block';
        console.log('this is running');
        if (result.error) {
            console.log(result.error);
            document.querySelector('#message').innerHTML = result.error;
        } else {
            console.log('successful');
            document.querySelector('#message').innerHTML = result.message;
            document.querySelector('#compose-content').value = "";
            load_posts('all', 1);
        }
    });
    return false;
}

function load_posts(type, page) {
    //make call to API

    document.querySelector('#posts-view').style.display = 'block';

    document.querySelector('#posts-view').innerHTML = `<div class="container" id="posts"></div>`;
    fetch(`/posts/${type}/${page}`)
    .then(response => response.json())
    .then(posts => {
        console.log(posts);
        console.log(page);
        if (posts.message) {
            document.querySelector('#message').style.display = 'block';
            document.querySelector('#message').innerHTML = posts.message;
        
        } else {
            posts.forEach(post => {
                if (post.user) {
                    //if user == true, put that into api
                    //Post container
                    const p_row = document.createElement('div');
                    p_row.setAttribute('class',` row no-gutters post .d-xs-none`);

                    //const p_container = document.createElement('div');
                    //p_container.setAttribute('class',` container-fluid`);

                    //user
                    const user_col = document.createElement('div');
                    user_col.setAttribute('class', 'col-10 post-col');
                    user_col.setAttribute('id', 'post-user');

                    const p_user = document.createElement('h4');
                    p_user.innerHTML = post.user;
                    p_user.onclick = () => {
                        console.log(type);
                        if (type === 'all' || type === 'following') {
                            load_profile(post.user);
                            console.log(post.user);
                        }
                    }

                    user_col.appendChild(p_user);

                    p_row.appendChild(user_col);

                    //Following button
                    if (post.to_follow != "None" && (type == 'all' || type === 'following')) {
                        const buttons_row = document.createElement('div');
                        buttons_row.setAttribute('class', 'col-2');

                        const content_end = document.createElement('div');
                        content_end.setAttribute('class', 'd-flex justify-content-end post-col');

                        const follow_button = document.createElement('button');
                        follow_button.setAttribute('class',`btn btn-sm btn-outline-dark`);

                        if (post.to_follow == "follow"){
                            follow_button.innerHTML = 'Follow';
                        } else {
                            follow_button.innerHTML = 'Unfollow';
                        }

                        follow_button.onclick = () => {
                            //follow_button.innerHTML = "clicked";
                            fetch(`follow/${post.user}`)
                            .then(response => response.json())
                            .then(profile => {
                                load_posts(type, page);
                                //following_posts();
                                //we need to reload the whole page because the follow button is on multiple posts, and this is on a singular post
                            });
                        }
                        
                        content_end.appendChild(follow_button);
                        buttons_row.append(content_end);

                        p_row.appendChild(buttons_row);
                    }

                    //timestamp
                    const timestamp_col = document.createElement('div');
                    timestamp_col.setAttribute('class', 'col-12 post-col');
                    timestamp_col.setAttribute('id', 'post-timestamp');

                    const p_timestamp = document.createElement('div');
                    p_timestamp.setAttribute('class', 'timestamp');
                    timestamp_col.innerHTML = `<p>${post.timestamp}</p>`;

                    p_row.appendChild(timestamp_col);

                    //timestamp_row.appendChild(p_timestamp);

                    //content
                    const content_col = document.createElement('div');
                    content_col.setAttribute('class', 'col-12 post-col');
                    content_col.setAttribute('id', 'post-content');

                    const p_content = document.createElement('div');
                    p_content.setAttribute('class', 'content');
                    p_content.innerHTML = post.content;

                    content_col.appendChild(p_content);

                    p_row.appendChild(content_col);

                    //Likes
                    const like_col = document.createElement('div');
                    like_col.setAttribute('class', 'col-10');
                    const likes = document.createElement('div');

                    //const like_span = document.createElement('span');
                    //like_span.setAttribute('class', 'text-truncate');
                    //like_span.innerHTML = post.num_likes;

                    //liked by
                    const like_preview = document.createElement('div');
                    like_preview.setAttribute('class', `col-8 like-preview text-truncate`);
                    like_preview.innerHTML = `${post.num_likes}${post.likes}`;
                    like_preview.style.display = "inline-block";

                    //Like button
                    const p_like = document.createElement('div');
                    p_like.setAttribute('class', 'like-button');
                    if (post.user_liked) {
                        p_like.innerHTML = "&#10084;"; //red heart
                    } else {
                        p_like.innerHTML = "&#9825;"; //empty heart
                    }
                    p_like.style.display = "inline-block";
                    
                    //p_like.innerHTML = "&#10084;";

                    p_like.onclick = () => {
                        fetch(`like/${post.id}`)
                        .then(response => response.json())
                        .then(post2 => {
                            console.log(post2.user_liked);
                            if (post2.user_liked === true) {
                                //make put method
                                p_like.innerHTML = "&#10084;";
                                //p_like.style.backgroundColor='pink';
                                //if it was liked, that means it was just unliked
                            } else {
                                p_like.innerHTML = "&#9825;";
                                //p_like.style.backgroundColor='white';
                            }
                            like_preview.innerHTML = `${post2.num_likes}${post2.likes}`;
                        
                        });
                        //console.log(post.user_liked);
                    }

                    like_col.append(p_like);
                    like_col.append(like_preview);
                    //like_col.append(like_span);

                    p_row.appendChild(like_col);

                    //Edit button
                    if (post.owned) {
                        const edit_row = document.createElement('div');
                        edit_row.setAttribute('class', 'col-2');

                        const content_end2 = document.createElement('div');
                        content_end2.setAttribute('class', 'd-flex justify-content-end post-col');

                        const edit_button = document.createElement('button');
                        edit_button.setAttribute('class',`btn btn-sm btn-outline-dark`);
                        edit_button.innerHTML = 'Edit';

                        edit_button.onclick = () => {
                            //build entire text field
                            fetch(`post/${post.id}`)
                            .then(response => response.json())
                            .then(post => {
                                const form_col = document.createElement('div');
                                form_col.setAttribute('class', 'col-12 post-col');
                                form_col.setAttribute('id', 'post-content');

                                const edit_form = document.createElement('form');
                                edit_form.setAttribute('id', 'edit-form');
                                
                                const edit_input = document.createElement('textarea');
                                edit_input.setAttribute('class', 'form-control');
                                edit_input.innerHTML = post.content;
                                edit_input.setAttribute('id', 'edit-content');

                                edit_form.appendChild(edit_input);
                                //edit_form.appendChild(edit_submit);
                                form_col.appendChild(edit_form)
                                
                                p_row.replaceChild(form_col, content_col);

                                const submit_row = document.createElement('div');
                                submit_row.setAttribute('class', 'col-2');

                                const content_end3 = document.createElement('div');
                                content_end3.setAttribute('class', 'd-flex justify-content-end post-col');

                                const edit_submit = document.createElement('button');
                                edit_submit.setAttribute('class',`btn btn-sm btn-outline-dark`);
                                edit_submit.innerHTML = 'Submit';

                                edit_submit.onclick = () => {
                                    fetch(`/post/${post.id}`, {
                                        method: 'PUT',
                                        body: JSON.stringify({
                                        content: document.querySelector('#edit-content').value,
                                        })
                                    })
                                    .then( response => response.json())
                                    .then( result => {
                                        document.querySelector('#message').style.display = 'block';
                                        console.log('this is running');
                                        if (result.error) {
                                            console.log(result.error);
                                            document.querySelector('#message').innerHTML = result.error;
                                        } else {
                                            console.log('successful');
                                            document.querySelector('#message').innerHTML = result.message;
                                            document.querySelector('#compose-content').value = "";
                                            load_posts('all', page);
                                        }
                                    });
                                }

                                content_end3.appendChild(edit_submit);
                                submit_row.append(content_end3);

                                p_row.replaceChild(submit_row, edit_row);
                                });
                            //change button

                            //submit button onclick
                                //reload the page
                        }
                        
                        content_end2.appendChild(edit_button);
                        edit_row.append(content_end2);

                        p_row.appendChild(edit_row);
                    }

                    //Add to post container
                    
                    //p_row.appendChild(p_container);

                    //e.onclick = () => {load_email(email.id, mailbox);console.log(`email ${email.id} clicked on`);}
                    //make each email clickable
                
                    //console.log(post);

                    //Add post to posts
                    document.querySelector("#posts").appendChild(p_row);
                } else {
                    const current_page = document.querySelector('#current-page');
                    current_page.innerHTML = page;

                    const prev_page = document.querySelector('#prev-page');
                    prev_page.style.visibility = "hidden";

                    const next_page = document.querySelector('#next-page');
                    next_page.style.visibility = "hidden";

                    const prev_arrow = document.querySelector('#prev-arrow');
                    prev_arrow.style.visibility = "hidden";

                    const next_arrow = document.querySelector('#next-arrow');
                    next_arrow.style.visibility = "hidden";

                    if (post.prev != false) {
                        prev_page.innerHTML = post.prev;
                        prev_page.style.visibility = "visible";

                        prev_page.onclick = () => {
                            load_posts(type, post.prev);
                        }

                        if (post.bwd) {
                            prev_arrow.style.visibility = "visible";
                        }
                    } 

                    if (post.next != false) {
                        next_page.innerHTML = post.next;
                        next_page.style.visibility = "visible";

                        next_page.onclick = () => {
                            load_posts(type, post.next);
                        }

                        if (post.fwd) {
                            next_arrow.style.visibility = "visible";
                        }
                    } 

                }
            });

            //paginator stuff
            const current_page = document.querySelector('#current-page');
            current_page.innerHTML = page;
        }

    });
}