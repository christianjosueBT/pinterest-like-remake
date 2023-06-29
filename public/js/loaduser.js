// makes a fetch request to load user data in
function loadUser() {
  fetch('/users/login?isLoggedIn')
    .then(res => res.json())
    .then(user => {
      // console.log(user);
      loadUserData(user)
    })
    .catch(error => console.log(error))
  return
}

// if there is a user logged in, displays their username and profile picture in the navbar
// if there is no user logged in, displays a default user picture and a LOGIN button
function loadUserData(user) {
  if (user && Object.keys(user).length > 0) {
    // user = JSON.parse(user);
    const nav = document.querySelector('.nav__user__div')
    document.querySelector('.nav__user__a')?.remove()
    const userVar = nav.querySelector('.user')
    const username = nav.querySelector('.username')
    const profile = nav.querySelector('.dropdown--profile')
    const form = nav.querySelector('#navForm')
    const logout = nav.querySelector('#submit')

    nav.classList.remove('hide')
    userVar.classList.remove('hide')
    username.textContent = user.username

    const img = new Image()
    const picture = document.createElement('div')

    img.src = user.profilePicture.url

    picture.className = 'picture order-1'
    picture.appendChild(img)
    nav.appendChild(picture)
    profile.href = `/user/${user._id}`
    logout.addEventListener('pointerdown', () => form.submit())
    logout.addEventListener('keypress', function (e) {
      const key = e.keyCode || e.which
      if (key === 13) {
        form.submit()
      }
    })
  } else {
    const nav = document.querySelector('.nav__user__a')
    document.querySelector('.nav__user__div')?.remove()
    const login = nav.querySelector('.login')

    nav.classList.remove('hide')
    login.classList.remove('hide')

    const img = new Image()
    const picture = document.createElement('div')

    img.src =
      'https://res.cloudinary.com/christianjosuebt/image/upload/coffeeShops/smile_bpkzip.svg'
    picture.className = 'picture order-1'
    picture.appendChild(img)
    nav.appendChild(picture)
    nav.classList.add('height--80')
    nav.href = '/users/login'
  }
  return
}

loadUser()
