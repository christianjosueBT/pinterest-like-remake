const controller = new AbortController()
const container = document.querySelector('.card--showpage')
const images = container.querySelectorAll('.carousel__image')
const length = images.length
let user = {}

// functionality that lets us show and close dialog modalBtns
const modalBtns = document.querySelectorAll('.openModal')
modalBtns.forEach(button => {
  button.addEventListener('click', event => {
    const modal = document.querySelector(`#${event.target.dataset.modal}`)
    modal.showModal()
  })
})
const closeButtons = document.querySelectorAll('.closeModal')
closeButtons.forEach(button => {
  button.addEventListener('click', event => {
    const modal = event.target.closest('dialog')
    modal.close()
  })
})

// Function that shows form buttons when relevant input is focused
function toggleButtons() {
  const input = document.querySelector('.comment .input')
  const aside = document.querySelector('.comment__aside')
  const transparent = document.querySelector('.comment .cancel')

  input.addEventListener('focus', function () {
    aside.classList.remove('hide')
  })
  transparent.addEventListener('click', function () {
    aside.classList.add('hide')
    input.value = ''
  })
}

function stars() {
  const svg = document.querySelector('.stars--parent')
  const label = document.querySelector('.label')

  // label.addEventListener('input', starsLabel)
  // svg.addEventListener('click', starsToggle)
  // svg.addEventListener('mousemove', starsMouse)
  // svg.setAttribute('listener', 'true')
}

function starsToggle() {
  const svg = document.querySelector('.stars--parent')
  if (svg.getAttribute('listener') !== 'true') {
    svg.addEventListener('mousemove', starsMouse)
    svg.setAttribute('listener', 'true')
  } else if (svg.getAttribute('listener') === 'true') {
    svg.removeEventListener('mousemove', starsMouse)
    svg.removeAttribute('listener')
  }
  return
}

function starsMouse(event) {
  const svg = document.querySelector('.stars--parent')
  const inner = document.querySelector('.stars--custom')
  const rating = document.querySelector('.stars--rating')
  let point = svg.createSVGPoint()

  point.x = event.clientX
  point = point.matrixTransform(svg.getScreenCTM().inverse())
  inner.setAttribute('width', Math.abs(point.x))
  rating.value = checkRating(point.x)

  return
}

function starsLabel(event) {
  const inner = document.querySelector('.stars--custom')
  let target = event.target
  let num = 0

  if (target.value < 1) num = target.value * 300 + 100
  else if (target.value < 2) num = (target.value % 1) * 300 + 600
  else if (target.value < 3) num = (target.value % 2) * 300 + 1100
  else if (target.value < 4) num = (target.value % 3) * 300 + 1600
  else if (target.value <= 5) num = (target.value % 4) * 300 + 2100
  inner.setAttribute('width', num)
  return
}

function setStarsWidth() {
  const reviews = document.querySelectorAll('.comment__main__title')
  for (const review of reviews) {
    const inner = review.querySelector('.stars--inner')
    inner.setAttribute('width', width)
  }
  return
}

function checkRating(value) {
  let x = 0
  if (value < 100) x = 0
  else if (value > 100 && value < 400) x = (value - 100) / 300
  else if (value > 400 && value < 600) x = 1
  else if (value > 600 && value < 900) x = 1 + (value - 600) / 300
  else if (value > 900 && value < 1100) x = 2
  else if (value > 1100 && value < 1400) x = 2 + (value - 1100) / 300
  else if (value > 1400 && value < 1600) x = 3
  else if (value > 1600 && value < 1900) x = 3 + (value - 1600) / 300
  else if (value > 1900 && value < 2100) x = 4
  else if (value > 2100 && value < 2400) x = 4 + (value - 2100) / 300
  else if (value > 2400) x = 5
  x = Math.round((x + Number.EPSILON) * 100) / 100
  return x
}

// Function that places images in their starting locations
function setImages() {
  let l = 0.0

  images[0].style.left = '0px'
  for (let i = 1; i < length; i++) {
    l += images[i - 1].scrollWidth
    images[i].style.left = `${l}px`
  }
}

//
function changeLeft(images) {
  for (let i = 0; i < length; i++) {
    // we check if the image is the left most image
    // if the image's left property is less than zero
    // and greater than or equal to its negative width, it is the leftmost image
    if (
      parseFloat(images[i].style.left) <= 0 &&
      parseFloat(images[i].style.left) >= -images[i].scrollWidth
    ) {
      if (i === 0 && parseFloat(images[i].style.left) === 0) return
      else if (parseFloat(images[i].style.left) === 0) {
        const L0 = parseFloat(images[i].scrollWidth)
        for (let j = 0; j < length; j++) {
          const L = parseFloat(images[j].style.left)
          images[j].style.left = `${L + L0}px`
        }
        return
      } else {
        const L0 = parseFloat(images[i].style.left)
        for (let j = 0; j < length; j++) {
          const L = parseFloat(images[j].style.left)
          images[j].style.left = `${L - L0}px`
        }
        return
      }
    }
  }
}

function changeRight(images) {
  const width = window.innerWidth
  for (let i = 0; i < length; i++) {
    if (
      parseFloat(images[i].style.left) <= width &&
      parseFloat(images[i].style.left) >= width - images[i].scrollWidth
    ) {
      const rightMost = images[i]
      // console.log('index: i ', i)
      // console.log('left: ', rightMost.style.left)
      // console.log('scroll width: ', rightMost.scrollWidth)
      // console.log('window width: ', width)
      // console.log('w - scroll: ', width - rightMost.scrollWidth)
      if (
        i === length - 1 &&
        parseFloat(rightMost.style.left) === width - rightMost.scrollWidth
      )
        return
      else if (
        parseFloat(rightMost.style.left) ===
        width - rightMost.scrollWidth
      ) {
        const L0 = images[i + 1].scrollWidth
        console.log('L0: ', L0)
        for (let j = 0; j < length; j++) {
          const L = parseFloat(images[j].style.left)
          images[j].style.left = `${L - L0}px`
        }
        return
      } else {
        const L0 =
          rightMost.scrollWidth - (width - parseFloat(rightMost.style.left))
        console.log('L0: ', L0)
        for (let j = 0; j < length; j++) {
          const L = parseFloat(images[j].style.left)
          images[j].style.left = `${L - L0}px`
        }
        return
      }
    }
  }
}

function buttons(images) {
  const left = document.querySelector('.button--left')
  const right = document.querySelector('.button--right')

  left.addEventListener('click', function () {
    changeLeft(images)
  })
  right.addEventListener('click', function () {
    changeRight(images)
  })
}

function loadImages(images) {
  const height = container.scrollHeight
  const pixelRatio = window.devicePixelRatio || 1.0

  let str = `https://res.cloudinary.com/christianjosuebt/image/upload/q_auto,f_auto,fl_lossy,h_${Math.round(
    height * pixelRatio
  )}/coffeeShops`
  for (let i = 0; i < images.length; i++) {
    images[i].src = `${str}/${images[i].dataset.src}`
  }
}

function loadRatings() {
  const reviews = document.querySelectorAll('.comment__main__title')
  for (const review of reviews) {
    const rating = review.querySelector('.rating')
    const ratingNum = rating?.dataset.rating
    const ratingCups = rating?.children
    for (let i = 0; i < ratingNum; i++) {
      ratingCups[i].firstElementChild.href.baseVal = '#cupFill'
    }
  }
}

function setRating() {
  const makeRating = document.querySelector('#makeRating')
  const input = makeRating?.querySelector('input')

  makeRating?.addEventListener('click', ratingEventListener)
}

function ratingEventListener(event) {
  let target = event.target
  let curr = target.tagName.toLowerCase() !== 'svg' ? target.parentNode : target
  let next = curr.nextElementSibling

  while (next && next.tagName.toLowerCase() === 'svg') {
    next.firstElementChild.href.baseVal = '#cup'
    next = next.nextElementSibling
  }

  if (next.tagName.toLowerCase() === 'input') next.value = curr.dataset.rating

  while (curr) {
    curr.firstElementChild.href.baseVal = '#cupFill'
    curr = curr.previousElementSibling
  }
}

document.addEventListener('readystatechange', event => {
  if (document.readyState === 'complete') {
    setImages()
    // stars()
    buttons(images)
    toggleButtons()
    // setStarsWidth()
    loadRatings()
    setRating()
  }
})

loadImages(images)

window.addEventListener('resize', setImages, { signal: controller.signal })
