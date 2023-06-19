// global variables
const heights = []
const images = document.querySelectorAll('.carousel__image')
const footer = document.querySelector('footer')
const grid = document.querySelector('.grid')
const searchbar__input = document.querySelector('.searchbar__input')
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
let masonry

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

function getTransform(element) {
  const transform = element.style.transform
  const re = /translate3d\((?<x>.*?)px, (?<y>.*?)px, (?<z>.*?)px/
  const results = re.exec(transform)
  return {
    x: Number(results?.groups.x),
    y: Number(results?.groups.y),
    z: Number(results?.groups.z),
  }
}

function scaleElement(element, oldItemInfo, newItemInfo) {
  console.log('Element from scaleElement', element)

  let coords = getTransform(element)
  console.log('coords', coords)

  const scaleX = oldItemInfo.width / newItemInfo.width
  const scaleY = oldItemInfo.height / newItemInfo.height
  console.log('scaleX', scaleX)
  console.log('scaleY', scaleY)
  console.log('oldItemInfo.borderRadius', oldItemInfo.borderRadius)
  console.log('newItemInfo.borderRadius', newItemInfo.borderRadius)

  element.style.removeProperty('transform')
  element.animate(
    [
      {
        transform: `translate3d(${coords.x}px, ${coords.y}px,0) scale(${scaleX}, ${scaleY})`,
        borderRadius: `${oldItemInfo.borderRadius}px`,
      },
      {
        transform: `translate3d(${coords.x}px, ${coords.y}px,0)`,
        borderRadius: `${newItemInfo.borderRadius}px`,
      },
    ],
    {
      duration: 250,
      easing: 'ease-out',
    }
  )

  element.style.transform = `translate3d(${coords.x}px, ${coords.y}px,0)`

  console.log('Element from scaleElement', element)
}

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
  page++
  colWidth =
    parseInt(
      window.getComputedStyle(document.body).getPropertyValue('font-size')
    ) * 20
  let str = window.location.href.includes('?')
    ? `${window.location.href}&page=${page}`
    : `/coffeeShops?page=${page}`

  try {
    let res = await fetch(str)
    let data = await res.json()
    let items = []

    for (let i = 0; i < data.length; i++) {
      let card = await createCard(data[i])
      simpleM.append(card)
    }
  } catch (e) {
    console.log('error in getData()')
    console.log('e: ', e)
  }
  return
}

// ********************************************************************
// updating the location of everything in the page
// ********************************************************************

// places cards where they should be to get a pinterest like layout
// function setupBlocks() {
//   colWidth =
//     parseInt(
//       window.getComputedStyle(document.body).getPropertyValue('font-size')
//     ) * 16;
//   blocks = document.querySelectorAll('.card');
//   // getting window width, width of a card, and setting the margin to be equal to one rem
//   windowWidth = window.innerWidth;
//   margin = parseInt(
//     window.getComputedStyle(document.body).getPropertyValue('font-size')
//   );
//   // calculating how many cards fit in a "row" of the viewport
//   colCount = Math.floor(windowWidth / (colWidth + margin));
//   // calculating the space the cards will take (including the margin I want between them as well as the
//   // minimum margin between the cards and the left and right side of the page)
//   cardsSpace = colCount * (colWidth + margin);
//   // calculating the whitespace that will remain
//   whiteSpace = windowWidth - cardsSpace;
//   // only placing the cards that fit in the first row in their appropriate places
//   if (blocks.length >= colCount) {
//     for (let i = 0; i < colCount; i++) {
//       // I want the white space to be divided evenly on the left and right side of the page
//       blocks[i].style.left = `${
//         (whiteSpace + margin) / 2 + (colWidth + margin) * i
//       }px`;
//       // placing the cards at the top of their container and letting top margin take care of the rest
//       blocks[i].style.top = '0px';
//       // storing height of each of these cards in an array called "heights"
//       heights.push(blocks[i].offsetHeight + margin);
//     }
//   } else if (blocks.length !== 1) {
//     for (let i = 0; i < blocks.length; i++) {
//       // I want the white space to be divided evenly on the left and right side of the page
//       blocks[i].style.left = `${
//         (whiteSpace + margin) / 2 + (colWidth + margin) * i
//       }px`;
//       // placing the cards at the top of their container and letting top margin take care of the rest
//       blocks[i].style.top = '0px';
//       // storing height of each of these cards in an array called "heights"
//       heights.push(blocks[i].offsetHeight + margin);
//     }
//   } else if (blocks.length === 1) {
//     blocks[0].style.left = `${(windowWidth - colWidth) / 2}px`;
//     blocks[0].style.top = '0px';
//     heights.push(blocks[0].offsetHeight + margin);
//   }
//   // placing the remainder of the cards
//   for (let i = colCount; i < blocks.length; i++) {
//     // calculating the smallest value in the array of heights
//     min = Math.min(...heights);
//     // calculating the index of this of this smallest value
//     index = heights.findIndex(n => n === min);
//     // placing a card below the shortest card column
//     blocks[i].style.left = `${blocks[index].offsetLeft}px`;
//     blocks[i].style.top = `${heights[index]}px`;
//     // updating the heights array to reflect the new height of the column
//     heights[index] += blocks[i].offsetHeight + margin;
//   }
//   footer.style.top = `${Math.max(...heights) + 20}px`;
//   // resetting the heights array to reuse this function if needed
//   heights.length = [];
//   return;
// }

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

  window.click = function (event) {
    if (!toggle.contains(event.target)) {
      const dropDown = document.querySelector('.dropdown')
      if (dropDown.classList.contains('is-open'))
        dropDown.classList.remove('is-open')
    }
  }
  return
}

// Functions that change the layout of the page
/**
 * Changes the state of the page to 'masonry' and changes all cards to the masonry layout style by removing and adding css classes and replacing the images of the cards for more suitable ones
 * @returns {Void}
 */
function masonryLayout(e) {
  if (e.type === 'keyup') {
    if (e.key !== 'Enter') return
  }

  state = 'masonry'
  const shops = document.querySelector('#macyContainer')
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
function largeLayout(e) {
  if (e.type === 'keyup') {
    if (e.key !== 'Enter') return
  }

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
  return
}
/**
 * Changes the state of the page to 'small' and changes all cards to the small layout style by removing and adding css classes and replacing the images of the cards for more suitable ones
 * @returns {Void}
 */
function smallLayout(e) {
  if (e.type === 'keyup') {
    if (e.key !== 'Enter') return
  }

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
  return
}

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
document.querySelector('#masonry-grid').addEventListener('keyup', masonryLayout)
document.querySelector('#large-grid').addEventListener('keyup', largeLayout)
document.querySelector('#small-grid').addEventListener('keyup', smallLayout)

for (block of blocks) {
  block.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      console.log('THIS IS WEIRD')
      event.target.querySelector('a')?.click()
    }
  })
}

// ********************************************************************
// loading images, creating new cards, changing displayed images
// ********************************************************************

/**
 * Given a list of images to load and the dimensions of the viewport, calculates ideal image sizes and dynamically loads them in to the page
 * @param {nodeList} images list of images to be loaded
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
}

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
  Promise.all(sources.map(loadImage)).then(imgs => {
    for (let i = 0; i < imgs.length; i++) {
      if (i === 0) imgs[i].className = 'active carousel__image'
      else imgs[i].className = 'carousel__image'
      let a = document.createElement('a')
      a.setAttribute('href', `/coffeeShops/${id}`)
      a.appendChild(imgs[i])
      card__image.appendChild(a)
    }
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
  svgLeft.setAttribute('width', '48')
  svgRight.setAttribute('width', '48')
  svgLeft.setAttribute('viewBox', '0 0 24 24')
  svgRight.setAttribute('viewBox', '0 0 24 24')
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
  p.textContent =
    'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Laudantium perspiciatis harum totam voluptatibus dolore recusandae laboriosam reiciendis ex autem eum, veniam, beatae, debitis ipsa in! Est laborum molestias ratione nesciunt!'

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

    console.log('olditeminfo', oldItemInfo)
    console.log('newiteminfo', newItemInfo)

    masonry.layoutCol(this.parentElement.parentElement)
    // scaleElement(this.parentElement.parentElement, oldItemInfo, newItemInfo)
  }
}

// searchbar__input.addEventListener('submit', handleFormSubmit)

function loadRatings() {
  const avgRatings = document.querySelectorAll('.rating')
  for (const avgRating of avgRatings) {
    const ratingNum = avgRating?.dataset.rating
    const ratingInteger = Math.floor(ratingNum)
    const ratingRemainder = (Math.round(ratingNum * 10) / 10) % 1
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

stopPropagation()
loadImages(images)

// waiting until everything has loaded to run the function that places cards where they
// should be
document.addEventListener('readystatechange', event => {
  if (document.readyState === 'complete') {
    dropDown()
    const observer = new IntersectionObserver(handleIntersect, options)
    observer.observe(footer)
    carousel()
    loadRatings()

    // https://spope.github.io/MiniMasonry.js/
    masonry = new MiniMasonry({
      container: '#macyContainer',
    })
  }
})

// Much of this was written using the url below as a guideline
// https://benholland.me/javascript/2012/02/20/how-to-build-a-site-that-works-like-pinterest.html
