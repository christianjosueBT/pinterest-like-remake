// global variables
const heights = []
const images = document.querySelectorAll('.carousel__image')
const footer = document.querySelector('footer')
const container = document.querySelector('.container--100')
const grid = document.querySelector('.grid')
const searchbar__input = document.querySelector('.searchbar__input')
let blocks = document.querySelectorAll('.card')
let state = 'masonry'
let margin = 0
let windowWidth = 0
let colWidth =
  parseInt(
    window.getComputedStyle(document.body).getPropertyValue('font-size')
  ) * 20
let cardsSpace = 0
let colCount = 0
let whiteSpace = 0
let min = 0
let index = 0
let page = 0
let user = {}

// ********************************************************************
// simple masonry
// ********************************************************************
let simpleM = new SimpleMasonry({
  masonryBox: '.row',
  masonryColumn: '.grid',
})

// taken from https://stackoverflow.com/questions/11106876/is-it-possible-to-animate-flexbox-inserts-removes

/**
 * Generates and returns an array of objects containing the size and location of a node element's children
 * @param {Node} container parent node element containing all the children to be animated
 * @returns {Array of Objects} array containing size and location information of the parent's children
 */
function getFlexItemsInfo(container) {
  return Array.from(container.children).map(item => {
    const rect = item.getBoundingClientRect()
    return {
      element: item,
      x: rect.left,
      y: rect.top,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    }
  })
}

/**
 * Animates the transition between the old position and size of some elements, and their future position and size
 * @param {Array of Objects} oldFlexItemsInfo contains the past location and size information of the items of interest
 * @param {Array of Objects} newFlexItemsInfo contains the new location and size information of the items of interest
 * @returns {void}
 */
function aminateFlexItems(oldFlexItemsInfo, newFlexItemsInfo) {
  for (const newFlexItemInfo of newFlexItemsInfo) {
    const oldFlexItemInfo = oldFlexItemsInfo.find(
      itemInfo => itemInfo.element === newFlexItemInfo.element
    )

    const translateX = oldFlexItemInfo.x - newFlexItemInfo.x
    const translateY = oldFlexItemInfo.y - newFlexItemInfo.y
    const scaleX = oldFlexItemInfo.width / newFlexItemInfo.width
    const scaleY = oldFlexItemInfo.height / newFlexItemInfo.height

    newFlexItemInfo.element.animate(
      [
        {
          transform: `translate(${translateX}px, ${translateY}px)`,
        },
        { transform: 'none' },
      ],
      {
        duration: 250,
        easing: 'ease-out',
      }
    )
  }

  return
}

// ********************************************************************
// intersection observer
// ********************************************************************

// options for the intersection observer
let options = {
  root: null,
  rootMargins: '0px',
  threshold: 0.5,
}

/**
 * Function to be passed to an intersection observer. It runs when an intersection is detected. If the first object of the list is intersecting, we fetch data
 * @param {Array} entries List of node elements we will be observing
 */
function handleIntersect(entries) {
  if (entries[0].isIntersecting) {
    fetchCards()
  }
}

/**
 * Makes a post request to the specified URL using the provided form data
 * @param {string} url The url we will fetch from
 * @param {FormData Object} formData The date from the form
 * @returns {response} Returns either a response json object or an error
 */
const postFormDataAsJson = async ({ url, formData }) => {
  const plainFormData = Object.fromEntries(formData.entries())
  const formDataJsonString = JSON.stringify(plainFormData)

  const fetchOptions = {
    // method: 'POST',
    // credentials: 'include',
    // mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: formDataJsonString,
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const errorMessage = await response.text()
    if (JSON.parse(errorMessage).error.name === 'TokenExpiredError') {
      await fetchToken(false)
      return postFormDataAsJson({ url, formData })
    } else throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * Handles form submits. Prevents default form submission, allowing us to handle form submission better
 * @param {event} event The event that triggered the callback (should be form submit)
 * @returns {void} Does not return anything
 */
const handleFormSubmit = async event => {
  event.preventDefault()
  const form = event.currentTarget
  const url = form.action

  if (!form.checkValidity()) {
    return
  }

  form.classList.add('was-validated')
  try {
    let formData = new FormData(form)
    let responseData = await postFormDataAsJson({ url, formData })
    if (responseData.ok) {
      return window.location.reload()
    }
  } catch (e) {
    console.log('error in handleFormSubmit', e)
    form.classList.remove('was-validated')
  }
  return
}

/**
 * Fetch data necessary for more cards, creates new card elements, and appends them onto our site using simple masonry's append functionality
 * @returns {Void}
 */
async function fetchCards() {
  page++
  colWidth =
    parseInt(
      window.getComputedStyle(document.body).getPropertyValue('font-size')
    ) * 20
  let str = window.location.href.includes('?')
    ? `${window.location.href}&page=${page}`
    : `/colcade?page=${page}`

  try {
    let res = await fetch(str)
    let data = await res.json()

    for (let i = 0; i < data.length; i++) {
      let card = await createCard(data[i])
      simpleM.append(card)
    }
  } catch (e) {
    console.log('error in fetchCards()', e)
  }
  return
}

// ********************************************************************
// LAYOUT FUNCTIONALITY
// ********************************************************************

/**
 * Toggles dropdown opening and closing. Closes dropdown if user clicks anywhere outside the dropdown.
 * @returns {Void}
 */
function dropDown() {
  const toggles = document.querySelectorAll('.dropdown')
  for (let toggle of toggles) {
    toggle.addEventListener('pointerdown', function (event) {
      event.stopPropagation()
      const dropdown = event.currentTarget
      dropdown.classList.toggle('is-open')
    })

    toggle.addEventListener('focusin', function (event) {
      console.log('focusin fired')
      const dropdown = event.currentTarget
      dropdown.classList.add('is-open')
    })

    toggle.addEventListener('focusout', function (event) {
      console.log('focusout fired')
      const dropdown = event.currentTarget
      dropdown.classList.remove('is-open')
    })
  }

  window.addEventListener('pointerdown', function (event) {
    if (!event.target.matches('.dropdown__toggle')) {
      const dropDowns = document.querySelectorAll('.dropdown')
      for (i = 0; i < dropDowns.length; i++) {
        if (dropDowns[i].classList.contains('is-open'))
          dropDowns[i].classList.remove('is-open')
      }
    }
  })

  return
}

// Functions that change the layout of the page
/**
 * Changes the state of the page to 'masonry' and changes all cards to the masonry layout style by removing and adding css classes and replacing the images of the cards for more suitable ones
 * @returns {Void}
 */
function masonryLayout() {
  state = 'masonry'
  const shops = document.querySelector('.container-fluid')
  shops.classList.remove('container--layout')
  const cards = document.querySelectorAll('.card')
  for (let card of cards) {
    card.classList.remove('card--large')
    card.classList.remove('card--small')
    card.classList.remove('card--layout')
    changeImages(card, colWidth)
  }
  return
}
/**
 * Changes the state of the page to 'large' and changes all cards to the large layout style by removing and adding css classes and replacing the images of the cards for more suitable ones
 * @returns {Void}
 */
function largeLayout() {
  state = 'large'
  const shops = document.querySelector('.container-fluid')
  shops.classList.add('container--layout')
  const cards = document.querySelectorAll('.card')
  for (let card of cards) {
    card.classList.add('card--large')
    card.classList.add('card--layout')
    card.classList.remove('card--small')
    changeImages(card, colWidth)
  }
  return
}
/**
 * Changes the state of the page to 'small' and changes all cards to the small layout style by removing and adding css classes and replacing the images of the cards for more suitable ones
 * @returns {Void}
 */
function smallLayout() {
  state = 'small'
  const shops = document.querySelector('.container-fluid')
  shops.classList.add('container--layout')
  const cards = document.querySelectorAll('.card')
  for (let card of cards) {
    card.classList.add('card--small')
    card.classList.add('card--layout')
    card.classList.remove('card--large')
    changeImages(card, colWidth)
  }
  return
}

// attaching pointerdown and enter key event listeners to the dropdown options: masonry, large, and small
document
  .querySelector('#masonry-grid')
  .addEventListener('pointerdown', masonryLayout)
document.querySelector('#masonry-grid').addEventListener('keypress', e => {
  if (e.key === 'Enter') masonryLayout()
})

document
  .querySelector('#large-grid')
  .addEventListener('pointerdown', largeLayout)
document.querySelector('#large-grid').addEventListener('keypress', e => {
  if (e.key === 'Enter') largeLayout()
})

document
  .querySelector('#small-grid')
  .addEventListener('pointerdown', smallLayout)
document.querySelector('#small-grid').addEventListener('keypress', e => {
  if (e.key === 'Enter') smallLayout()
})

// ********************************************************************
// CARD, CAROUSEL, AND IMAGE FUNCTIONALITY
// ********************************************************************

/**
 * Given a list of images to load and the dimensions of the viewport, calculates ideal image sizes and dynamically loads them in to the page
 * @param {nodelist} images list of images to be loaded
 * @returns {Void}
 */
function loadImages(images) {
  colWidth =
    parseInt(
      window.getComputedStyle(document.body).getPropertyValue('font-size')
    ) * 20
  const pixelRatio = window.devicePixelRatio || 1.0

  console.log(`pixel ratio is: ${pixelRatio}`)

  let str = `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy,w_${Math.round(
    colWidth * pixelRatio
  )}/coffeeShops`
  for (let i = 0; i < images.length; i++) {
    images[i].src = `${str}/${images[i].dataset.src}`
  }

  return
}
// sets the images sources for a card, accounts for device pixel ratio and size of the rendered element to deliver images optimized for data size
/**
 *
 * @param {*} card__image
 * @param {*} images
 * @param {*} colWidth
 * @param {*} id
 */
async function setImages(card__image, images, colWidth, id) {
  const pixelRatio = window.devicePixelRatio || 1.0
  let str = ''
  if (state === 'masonry') {
    str = `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy,w_${Math.round(
      colWidth * pixelRatio
    )}/coffeeShops`
  } else if (state === 'large') {
    str = `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy,w_${Math.round(
      colWidth * pixelRatio
    )},ar_2:3,c_fill/coffeeShops`
  } else if (state === 'small') {
    str = `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy,w_${Math.round(
      colWidth * pixelRatio
    )},ar_1:1,c_fill/coffeeShops`
  }

  const sources = []
  const fulfilledImages = []

  for (let i = 0; i < images.length; i++) {
    const src = [`${str}/${images[i].filename}`, images[i].filename]
    sources.push(src)
  }
  Promise.allSettled(sources.map(loadImage)).then(results => {
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        i === 0
          ? (results[i].value.className = 'active carousel__image')
          : (results[i].value.className = 'carousel__image')
        let a = document.createElement('a')
        a.setAttribute('href', `/coffeeShops/${id}`)
        a.appendChild(results[i].value)
        card__image.appendChild(a)
        fulfilledImages.push(results[i].value)
      } else {
        // console.log(results[i].reason)
      }
    }
    changePicture(card__image, fulfilledImages)
    return
  })
}
// changes the already loaded images sources to new ones that display the chosen aspect ratio
/**
 *
 * @param {Node} card Card whose images are to be changed
 * @param {*} colWidth
 * @returns
 */
function changeImages(card, colWidth) {
  const pixelRatio = window.devicePixelRatio || 1.0
  let str = ''
  const images = card.querySelectorAll('img')

  if (state === 'masonry') {
    str = `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy,w_${Math.round(
      colWidth * pixelRatio
    )}/coffeeShops`
  } else if (state === 'large') {
    str = `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy,w_${Math.round(
      colWidth * pixelRatio
    )},ar_2:3,c_fill/coffeeShops`
  } else if (state === 'small') {
    str = `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy,w_${Math.round(
      colWidth * pixelRatio
    )},ar_1:1,c_fill/coffeeShops`
  }

  for (let i = 0; i < images.length; i++) {
    images[i].src = `${str}/${images[i].dataset.src}`
  }
  return
}
// creates all elements a card needs, then puts them together and adds them to the page
async function createCard(data) {
  let className = 'card card--v2'
  if (state === 'large') className += ' card--layout card--large'
  else if (state === 'small') className += ' card--layout card--small'

  let card = document.createElement('div')
  let card__image = document.createElement('div')
  let card__image__top = document.createElement('div')
  let card__image__bottom = document.createElement('div')
  let h3 = document.createElement('h3')
  let h3__a = document.createElement('a')
  let p = document.createElement('p')
  let svgLeft = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let useLeft = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  let svgRight = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let useRight = document.createElementNS('http://www.w3.org/2000/svg', 'use')

  useLeft.setAttribute('href', '#svg--left')
  useRight.setAttribute('href', '#svg--right')
  svgLeft.setAttribute('class', 'button--svg button--left hide')
  svgRight.setAttribute('class', 'button--svg button--right hide')
  svgLeft.appendChild(useLeft)
  svgRight.appendChild(useRight)

  card.className = className
  card__image.className = 'card__image carousel'
  card__image__top.className = 'card__image__top'
  card__image__bottom.className = 'card__image__bottom'

  h3__a.textContent = data.name.split(/\s+/).slice(0, 4).join(' ')
  h3__a.setAttribute('href', `/coffeeShops/${data._id}`)
  p.textContent = `${data.description.slice(0, 50)}...`

  h3.appendChild(h3__a)

  card__image__top.appendChild(h3)
  card__image__bottom.appendChild(p)
  card__image.appendChild(card__image__top)
  card__image.appendChild(card__image__bottom)
  card__image.appendChild(svgLeft)
  card__image.appendChild(svgRight)

  card.appendChild(card__image)

  await setImages(card__image, data.images, colWidth, data._id)
  if (data.images.length > 1) {
    display([svgLeft, svgRight])
  }
  return card
}

// loads the images using promises
const loadImage = src =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src[0]
    img.dataset.src = src[1]
  })

// checks if element passed to it is "active" or not. Returns a boolean value
const active = element => element.classList.contains('active')
// changes which image is "active" to the left
function changeIndexLeft(images) {
  let index = 0
  for (let i = 0; i < images.length; i++) {
    if (active(images[i])) index = i
  }
  for (let i = 0; i < images.length; i++) {
    if (index === 0 && i === index) {
      images[i].classList.toggle('active')
      images[images.length - 1].classList.toggle('active')
    } else if (i === index && index !== 0) {
      images[i].classList.toggle('active')
      images[i - 1].classList.toggle('active')
    }
  }
}
// changes which image is "active" to the right
function changeIndexRight(images) {
  // coffeeShops.forEach((img, i) => img.style.display = obj.num === i ? 'block' : 'none');
  let index = 0
  for (let i = 0; i < images.length; i++) {
    if (active(images[i])) index = i
  }
  for (let i = 0; i < images.length; i++) {
    if (index === images.length - 1 && i === index) {
      images[i].classList.toggle('active')
      images[0].classList.toggle('active')
    } else if (i === index && index !== images.length - 1) {
      images[i].classList.toggle('active')
      images[i + 1].classList.toggle('active')
    }
  }
}
// displays hidden left and right buttons
function display(nodelist) {
  for (let i = 0; i < nodelist.length; i++) {
    nodelist[i].classList.remove('hide')
  }
}
// finds all carousel_images and calls the changeIndex functions where and if appropriate
function carousel() {
  const carousels = document.querySelectorAll('.carousel')
  for (let i = 0; i < carousels.length; i++) {
    const images = carousels[i].querySelectorAll('.carousel__image')
    if (images.length > 1) {
      changePicture(carousels[i], images)
      const svgs = carousels[i].querySelectorAll('.button--svg')
      display(svgs)
    }
  }
  return
}
// adds event listeneres to the left and right buttons on images so the user can click on them and
// change the picture being displayed
function changePicture(carousel, images) {
  const rightButton = carousel.querySelector('.button--right')
  rightButton.addEventListener('click', function () {
    let col = this.parentElement.parentElement.parentElement
    const oldFlexItemsInfo = getFlexItemsInfo(col)
    changeIndexRight(images)
    const newFlexItemsInfo = getFlexItemsInfo(col)

    aminateFlexItems(oldFlexItemsInfo, newFlexItemsInfo)
  })

  const leftButton = carousel.querySelector('.button--left')
  leftButton.addEventListener('click', function () {
    changeIndexLeft(images)
  })
}

// searchbar__input.addEventListener('submit', handleFormSubmit);

loadImages(images)

handleErrorCapture = event => {
  console.group('Error event captured at the dom')
  console.log(event)
  console.groupEnd()
}

document.addEventListener('error', handleErrorCapture, true)

// waiting until everything has loaded to run the function that places cards where they
// should be
document.addEventListener('readystatechange', event => {
  if (document.readyState === 'complete') {
    dropDown()
    simpleM.init()
    const observer = new IntersectionObserver(handleIntersect, options)
    observer.observe(footer)
    carousel()

    const keyboardfocusableElements = document.querySelectorAll(
      'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    )
  }
})

// Much of this was written using the url below as a guideline
// https://benholland.me/javascript/2012/02/20/how-to-build-a-site-that-works-like-pinterest.html
