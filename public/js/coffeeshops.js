// global variables
const heights = []
const images = document.querySelectorAll('.carousel__image')
const footer = document.querySelector('footer')
const grid = document.querySelector('.grid')
const searchbar__form = document.querySelector('.searchbar__form')
let blocks = document.querySelectorAll('.card')
let state = 'masonry'
let margin = 24
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
let masonry, observer

// taken from https://stackoverflow.com/questions/11106876/is-it-possible-to-animate-flexbox-inserts-removes
/**
 * Generates and returns an array of objects containing the size and location of a node element's children
 * @param {Node} container parent node element containing all the children to be animated
 * @returns {Array of Objects} array containing size and location information of the parent's children
 */
function getFlexItemsInfo(elements) {
  return Array.from(elements).map(item => {
    const rect = item.getBoundingClientRect()
    return {
      // borderRadius: parseInt(getComputedStyle(item).borderRadius),
      element: item,
      x: rect.left,
      y: rect.top,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    }
  })
}
/**
 * Generates and returns an array of objects containing the size and location of a node element's children
 * @param {Node} container parent node element containing all the children to be animated
 * @returns {Array of Objects} array containing size and location information of the parent's children
 */
function getItemInfo(element) {
  const rect = element.getBoundingClientRect()
  return {
    borderRadius: parseInt(getComputedStyle(element).borderRadius),
    element: element,
    x: rect.left,
    y: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  }
}

// function getTransform(element) {
//   const transform = element.style.transform
//   const re = /translate3d\((?<x>.*?)px, (?<y>.*?)px, (?<z>.*?)px/
//   const results = re.exec(transform)
//   return {
//     x: Number(results?.groups.x),
//     y: Number(results?.groups.y),
//     z: Number(results?.groups.z),
//   }
// }

// function scaleElement(element, oldItemInfo, newItemInfo) {

//   let coords = getTransform(element)

//   const scaleX = oldItemInfo.width / newItemInfo.width
//   const scaleY = oldItemInfo.height / newItemInfo.height

//   element.style.removeProperty('transform')
//   element.animate(
//     [
//       {
//         transform: `translate3d(${coords.x}px, ${coords.y}px,0) scale(${scaleX}, ${scaleY})`,
//         borderRadius: `${oldItemInfo.borderRadius}px`,
//       },
//       {
//         transform: `translate3d(${coords.x}px, ${coords.y}px,0)`,
//         borderRadius: `${newItemInfo.borderRadius}px`,
//       },
//     ],
//     {
//       duration: 250,
//       easing: 'ease-out',
//     }
//   )

//   element.style.transform = `translate3d(${coords.x}px, ${coords.y}px,0)`

// }

/**
 * Animates the transition between the old position and size of some elements, and their future position and size
 * @param {Array of Objects} oldFlexItemsInfo contains the past location and size information of the items of interest
 * @param {Array of Objects} newFlexItemsInfo contains the new location and size information of the items of interest
 * @returns {void}
 */
function animateFlexItems(oldFlexItemsInfo, newFlexItemsInfo) {
  for (const newFlexItemInfo of newFlexItemsInfo) {
    const oldFlexItemInfo = oldFlexItemsInfo.find(
      itemInfo => itemInfo.element === newFlexItemInfo.element
    )

    const translateX = oldFlexItemInfo.x - newFlexItemInfo.x
    const translateY = oldFlexItemInfo.y - newFlexItemInfo.y
    const scaleX = oldFlexItemInfo.width / newFlexItemInfo.width
    const scaleY = oldFlexItemInfo.height / newFlexItemInfo.height
    // const borderRadius = oldFlexItemInfo.borderRadius / scaleY

    newFlexItemInfo.element.animate(
      [
        {
          transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
          // borderRadius: `${borderRadius}px`,
        },
        {
          transform: 'none',
          // borderRadius: `${oldFlexItemInfo.borderRadius}px`,
        },
      ],
      {
        duration: 250,
        easing: 'ease-out',
      }
    )
  }
}

function animateItems(previousItem, items) {
  let transform = parseInt(previousItem.style.getPropertyValue('top'))
}

// ********************************************************************
// intersection observer
// ********************************************************************

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
    getData()
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
 * Handles form submits. Prevents default form submission, allowing
 * us to handle form submission better
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

// if footer comes into view, get more cards
/**
 * Fetch data necessary for more cards, creates new card elements, and appends them onto our site
 * @returns {Void}
 */
async function getData() {
  console.log('getdata is running')

  page++
  let str = window.location.href.includes('?')
    ? `${window.location.href}&page=${page}`
    : `/coffeeShops?page=${page}&project=images,name&rating=true`

  try {
    let res = await fetch(str)
    let data = await res.json()
    let container = document.getElementById('macyContainer')

    for (let i = 0; i < data.length; i++) {
      let card = await createCard(data[i])
      container?.appendChild(card)
    }
  } catch (e) {
    console.log('error in getData()', e)
  }

  if (state === 'masonry') masonry.layout()
  masonry.reveal()
  return
}

// ********************************************************************
// dropwdown for changing the layout of the page observer
// and different layout options
// ********************************************************************

/**
 * Toggles dropdown opening and closing. Closes dropdown if user pointerdowns anywhere outside the dropdown.
 * @returns {Void}
 */
function dropDown() {
  const toggle = document.querySelector('.dropdown__toggle')
  toggle.addEventListener('pointerdown', function (event) {
    const dropdown = event.currentTarget.parentNode
    dropdown.classList.toggle('is-open')
  })
  toggle.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
      const dropdown = event.currentTarget.parentNode
      dropdown.classList.toggle('is-open')
    }
  })

  document.addEventListener('pointerdown', function (event) {
    if (!toggle.contains(event.target)) {
      const dropDown = document.querySelector('.dropdown')
      if (dropDown.classList.contains('is-open'))
        dropDown.classList.remove('is-open')
    }
  })
  return
}

// Functions that change the layout of the page
/**
 * Changes the state of the page to 'masonry' and changes all cards to the masonry layout style by removing and adding css classes and replacing the images of the cards for more suitable ones
 * @returns {Void}
 */
async function masonryLayout(e) {
  if (e.type === 'keyup' || state === 'masonry') {
    if (e.key !== 'Enter' || state === 'masonry') return
  }

  state = 'masonry'
  observer.unobserve(footer)

  const shops = document.querySelector('#macyContainer')
  shops.classList.remove('container--layout')
  const cards = document.querySelectorAll('.card')
  for (let card of cards) {
    card.classList.remove('card--large')
    card.classList.remove('card--small')
    card.classList.remove('card--layout')
    changeImages(card, colWidth)
  }

  masonry = await MiniMasonry.initialize({
    container: '#macyContainer',
    images: '.carousel__image',
  })

  setTimeout(() => {
    observer.observe(footer)
  }, 500)

  return
}
/**
 * Changes the state of the page to 'large' and changes all cards to the large layout style by removing and adding css classes and replacing the images of the cards for more suitable ones
 * @returns {Void}
 */
async function largeLayout(e) {
  if (e.type === 'keyup' || state === 'large') {
    if (e.key !== 'Enter' || state === 'large') return
  }

  observer.unobserve(footer)
  state = 'large'
  const shops = document.querySelector('#macyContainer')
  shops.classList.add('container--layout')
  const cards = document.querySelectorAll('.card')
  for (let card of cards) {
    card.classList.add('card--large')
    card.classList.add('card--layout')
    card.classList.remove('card--small')
    changeImages(card, colWidth)
  }
  await masonry.destroy()

  setTimeout(() => {
    observer.observe(footer)
  }, 500)
  return
}
/**
 * Changes the state of the page to 'small' and changes all cards to the small layout style by removing and adding css classes and replacing the images of the cards for more suitable ones
 * @returns {Void}
 */
async function smallLayout(e) {
  if (e.type === 'keyup' || state === 'small') {
    if (e.key !== 'Enter' || state === 'small') return
  }

  observer.unobserve(footer)
  state = 'small'
  const shops = document.querySelector('#macyContainer')
  shops.classList.add('container--layout')
  const cards = document.querySelectorAll('.card')
  for (let card of cards) {
    card.classList.add('card--small')
    card.classList.add('card--layout')
    card.classList.remove('card--large')
    changeImages(card, colWidth)
  }
  await masonry.destroy()

  setTimeout(() => {
    observer.observe(footer)
  }, 500)
  return
}

function setLayoutListeners() {
  // attaching pointerdown event listeners to the dropdown options: masonry, large, and small
  document
    .querySelector('#masonry-grid')
    .addEventListener('pointerdown', masonryLayout)
  document
    .querySelector('#large-grid')
    .addEventListener('pointerdown', largeLayout)
  document
    .querySelector('#small-grid')
    .addEventListener('pointerdown', smallLayout)
  document
    .querySelector('#masonry-grid')
    .addEventListener('keyup', masonryLayout)
  document.querySelector('#large-grid').addEventListener('keyup', largeLayout)
  document.querySelector('#small-grid').addEventListener('keyup', smallLayout)

  for (block of blocks) {
    block.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.target.querySelector('a')?.click()
      }
    })
  }
}

// ********************************************************************
// loading images, creating new cards, changing displayed images
// ********************************************************************

/**
 * sets the images sources for a card, accounts for device pixel ratio and size of the rendered element to deliver images optimized for data size
 * @param {*} a
 * @param {*} images
 * @param {*} cardWidth
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

  for (let i = 0; i < images.length; i++) {
    const src = [`${str}/${images[i].filename}`, images[i].filename]
    sources.push(src)
  }

  return Promise.all(sources.map(loadImage)).then(imgs => {
    let a
    imgs.forEach((img, i) => {
      if (i === 0) {
        a = document.createElement('a')
        a.setAttribute('href', `/coffeeshops/${id}`)
        a.setAttribute('tabindex', '-1')
        img.className = 'active carousel__image'
      } else {
        img.className = 'carousel__image'
      }
      a.appendChild(img)
    })

    card__image.prepend(a)
    changePicture(card__image, imgs)
    return
  })
}

/**
 * changes the already loaded images sources to new ones that display the chosen aspect ratio
 * @param {Node} card Card whose images are to be changed
 * @param {*} cardWidth
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
  let className = 'card hide'
  if (state === 'large') className += ' card--layout card--large'
  else if (state === 'small') className += ' card--layout card--small'

  let card = document.createElement('div')
  let card__image = document.createElement('div')
  let card__image__top = document.createElement('div')
  let title = document.createElement('h5')
  let card__image__bottom = document.createElement('div')
  let rating = document.createElement('p')
  let ratingDiv = document.createElement('div')
  let rating1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let use1 = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  let rating2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let use2 = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  let rating3 = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let use3 = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  let rating4 = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let use4 = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  let rating5 = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let use5 = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  let numRatings = document.createElement('p')

  let svgLeft = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let useLeft = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  let svgRight = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  let useRight = document.createElementNS('http://www.w3.org/2000/svg', 'use')

  card.className = className
  card__image.className = 'card__image carousel'
  card__image__top.className = 'card__image__top'
  title.textContent = data.name
  card__image__top.appendChild(title)
  card__image.appendChild(card__image__top)

  card__image__bottom.className = 'card__image__bottom'
  ratingDiv.className = 'rating flex--center'
  ratingDiv.dataset.rating = Math.round(data.avgRating * 10) / 10
  rating.textContent = Math.round(data.avgRating * 10) / 10

  rating1.setAttribute('width', '24')
  rating1.setAttribute('height', '30')
  use1.setAttribute('href', '#cup')
  rating1.appendChild(use1)

  rating2.setAttribute('width', '24')
  rating2.setAttribute('height', '30')
  use2.setAttribute('href', '#cup')
  rating2.appendChild(use2)

  rating3.setAttribute('width', '24')
  rating3.setAttribute('height', '30')
  use3.setAttribute('href', '#cup')
  rating3.appendChild(use3)

  rating4.setAttribute('width', '24')
  rating4.setAttribute('height', '30')
  use4.setAttribute('href', '#cup')
  rating4.appendChild(use4)

  rating5.setAttribute('width', '24')
  rating5.setAttribute('height', '30')
  use5.setAttribute('href', '#cup')
  rating5.appendChild(use5)

  ratingDiv.appendChild(rating1)
  ratingDiv.appendChild(rating2)
  ratingDiv.appendChild(rating3)
  ratingDiv.appendChild(rating4)
  ratingDiv.appendChild(rating5)

  numRatings.textContent = `(${data.reviewsCount})`
  card__image__bottom.appendChild(rating)
  card__image__bottom.appendChild(ratingDiv)
  card__image__bottom.appendChild(numRatings)
  card__image.appendChild(card__image__bottom)

  svgLeft.setAttribute('width', '48')
  svgRight.setAttribute('width', '48')
  svgLeft.setAttribute('viewBox', '0 0 24 24')
  svgRight.setAttribute('viewBox', '0 0 24 24')
  svgLeft.setAttribute('tabindex', '0')
  svgRight.setAttribute('tabindex', '0')
  svgLeft.setAttribute('class', 'button--svg button--left hide')
  svgRight.setAttribute('class', 'button--svg button--right hide')
  useLeft.setAttribute('href', '#svg--left')
  useRight.setAttribute('href', '#svg--right')
  svgLeft.appendChild(useLeft)
  svgRight.appendChild(useRight)

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
    let img = new Image()
    img.onload = () => resolve(img)
    img.onerror = error => {
      console.log('Error loading image:', error)
      reject('Error loading image')
    }
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
  if (index === 0) {
    images[index].classList.toggle('active')
    images[images.length - 1].classList.toggle('active')
  } else if (index !== 0) {
    images[index].classList.toggle('active')
    images[index - 1].classList.toggle('active')
  }
}
// changes which image is "active" to the right
function changeIndexRight(images) {
  // coffeeShops.forEach((img, i) => img.style.display = obj.num === i ? 'block' : 'none');
  let index = 0
  for (let i = 0; i < images.length; i++) {
    if (active(images[i])) index = i
  }
  if (index === images.length - 1) {
    images[index].classList.toggle('active')
    images[0].classList.toggle('active')
  } else if (index !== images.length - 1) {
    images[index].classList.toggle('active')
    images[index + 1].classList.toggle('active')
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
// adds event listeneres to the left and right buttons on images so the user can pointerdown on them and
// change the picture being displayed
function changePicture(carousel, images) {
  const rightButton = carousel.querySelector('.button--right')
  rightButton.addEventListener(
    'pointerdown',
    handleButtonpointerdownCurried(images)
  )
  rightButton.addEventListener('keyup', handleButtonpointerdownCurried(images))

  const leftButton = carousel.querySelector('.button--left')
  leftButton.addEventListener(
    'pointerdown',
    handleButtonpointerdownCurried(images)
  )
  leftButton.addEventListener('keyup', handleButtonpointerdownCurried(images))
}

function handleButtonpointerdownCurried(images) {
  return function handleButtonpointerdown(event) {
    if (event.type === 'keyup') {
      if (event.key !== 'Enter') return
    }

    const oldItemInfo = getItemInfo(this.parentElement.parentElement)

    if (this.classList.contains('button--right')) changeIndexRight(images)
    else changeIndexLeft(images)

    const newItemInfo = getItemInfo(this.parentElement.parentElement)

    // only update the position of the columns if state is set to masonry
    if (state === 'masonry') masonry.layoutCol(this.parentElement.parentElement)
    // scaleElement(this.parentElement.parentElement, oldItemInfo, newItemInfo)
  }
}

// searchbar__form.addEventListener('submit', handleFormSubmit)

function loadRatings() {
  const avgRatings = document.querySelectorAll('.rating')
  for (const avgRating of avgRatings) {
    const ratingNum = avgRating?.dataset.rating
    const ratingInteger = Math.floor(ratingNum)
    const ratingRemainder = Math.round((ratingNum % 1) * 10) / 10
    const ratingCups = avgRating?.children
    for (let i = 0; i < ratingInteger; i++) {
      ratingCups[i].firstElementChild.href.baseVal = '#cupFill'
    }
    if (ratingRemainder !== 0) {
      ratingCups[
        ratingInteger
      ].firstElementChild.href.baseVal = `#fill${ratingRemainder}`
    }
  }
}

function stopPropagation() {
  let elements = document.querySelectorAll('.stopPropagation')
  for (el of elements) {
    el.addEventListener('keyup', function (e) {
      e.stopPropagation()
      e.preventDefault()
    })
  }
}

// https://spope.github.io/MiniMasonry.js/

async function initialize() {
  masonry = await MiniMasonry.initialize({
    container: '#macyContainer',
    images: '.carousel__image',
  })
  stopPropagation()
  setLayoutListeners()
}

initialize()
// loadImages(, masonry._width)

// waiting until everything has loaded to run the function that places cards where they
// should be
document.addEventListener('readystatechange', event => {
  if (document.readyState === 'complete') {
    // masonry.layout()
    dropDown()
    observer = new IntersectionObserver(handleIntersect, options)
    observer.observe(footer)
    carousel()
    loadRatings()
  }
})

// Much of this was written using the url below as a guideline
// https://benholland.me/javascript/2012/02/20/how-to-build-a-site-that-works-like-pinterest.html
