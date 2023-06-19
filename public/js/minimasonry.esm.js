var MiniMasonry = function (conf) {
  this._sizes = []
  this._colSizes = []
  this._columns = []
  this._container = null
  this._count = null
  this._width = 0
  this._removeListener = null
  this._currentGutterX = null
  this._currentGutterY = null
  ;(this._resizeTimeout = null),
    (this.conf = {
      baseWidth: 255,
      gutterX: null,
      gutterY: null,
      gutter: 10,
      container: null,
      minify: true,
      ultimateGutter: 5,
      surroundingGutter: true,
      direction: 'ltr',
      wedge: false,
    })

  this.init(conf)

  return this
}

MiniMasonry.prototype.init = function (conf) {
  for (var i in this.conf) {
    if (conf[i] != undefined) {
      this.conf[i] = conf[i]
    }
  }

  if (this.conf.gutterX == null || this.conf.gutterY == null) {
    this.conf.gutterX = this.conf.gutterY = this.conf.gutter
  }
  this._currentGutterX = this.conf.gutterX
  this._currentGutterY = this.conf.gutterY

  this._container =
    typeof this.conf.container == 'object' && this.conf.container.nodeName
      ? this.conf.container
      : document.querySelector(this.conf.container)

  if (!this._container) {
    throw new Error('Container not found or missing')
  }

  var onResize = this.resizeThrottler.bind(this)
  window.addEventListener('resize', onResize)
  this._removeListener = function () {
    window.removeEventListener('resize', onResize)
    if (this._resizeTimeout != null) {
      window.clearTimeout(this._resizeTimeout)
      this._resizeTimeout = null
    }
  }

  this.layout()
}

MiniMasonry.prototype.reset = function () {
  this._sizes = []
  this._columns = []
  this._count = null
  this._width = this._container.clientWidth
  var minWidth = this.conf.baseWidth
  if (this._width < minWidth) {
    this._width = minWidth
    this._container.style.minWidth = minWidth + 'px'
  }
  this._width = this._container.clientWidth

  if (this.getCount() == 1) {
    // Set ultimate gutter when only one column is displayed
    this._currentGutterX = this.conf.ultimateGutter
    // As gutters are reduced, two column may fit, forcing to 1
    this._count = 1
  } else if (this._width < this.conf.baseWidth + 2 * this._currentGutterX) {
    // Remove gutter when screen is to low
    this._currentGutterX = 0
  } else {
    this._currentGutterX = this.conf.gutterX
  }
}

MiniMasonry.prototype.getCount = function () {
  if (this.conf.surroundingGutter) {
    return Math.floor(
      (this._width - this._currentGutterX) /
        (this.conf.baseWidth + this._currentGutterX)
    )
  }

  return Math.floor(
    (this._width + this._currentGutterX) /
      (this.conf.baseWidth + this._currentGutterX)
  )
}

MiniMasonry.prototype.computeWidth = function () {
  var width
  if (this.conf.surroundingGutter) {
    width =
      (this._width - this._currentGutterX) / this._count - this._currentGutterX
  } else {
    width =
      (this._width + this._currentGutterX) / this._count - this._currentGutterX
  }
  width = Number.parseFloat(width.toFixed(2))

  // console.log('this.conf.surroundingGutter:', this.conf.surroundingGutter)
  // console.log('this._width:', this._width)
  // console.log('this._currentGutterX:', this._currentGutterX)
  // console.log('this._count:', this._count)

  return width
}

MiniMasonry.prototype.layout = function () {
  if (!this._container) {
    console.error('Container not found')
    return
  }
  this.reset()

  //Computing columns count
  if (this._count == null) {
    this._count = this.getCount()
  }
  //Computing columns width
  var colWidth = this.computeWidth()

  for (var i = 0; i < this._count; i++) {
    this._columns[i] = 0
  }

  //Saving children real heights
  var children = this._container.children
  for (var k = 0; k < children.length; k++) {
    // Set colWidth before retrieving element height if content is proportional
    children[k].style.width = colWidth + 'px'
    this._sizes[k] = children[k].clientHeight
  }

  var startX
  if (this.conf.direction == 'ltr') {
    startX = this.conf.surroundingGutter ? this._currentGutterX : 0
  } else {
    startX =
      this._width - (this.conf.surroundingGutter ? this._currentGutterX : 0)
  }
  if (this._count > this._sizes.length) {
    //If more columns than children
    var occupiedSpace =
      this._sizes.length * (colWidth + this._currentGutterX) -
      this._currentGutterX
    if (this.conf.wedge === false) {
      if (this.conf.direction == 'ltr') {
        startX = (this._width - occupiedSpace) / 2
      } else {
        startX = this._width - (this._width - occupiedSpace) / 2
      }
    } else {
      if (this.conf.direction == 'ltr');
      else {
        startX = this._width - this._currentGutterX
      }
    }
  }
  // console.log('startX in layout function:', startX)

  //Computing position of children
  for (var index = 0; index < children.length; index++) {
    var nextColumn = this.conf.minify
      ? this.getShortest()
      : this.getNextColumn(index)

    var childrenGutter = 0
    if (this.conf.surroundingGutter || nextColumn != this._columns.length) {
      childrenGutter = this._currentGutterX
    }
    var x
    if (this.conf.direction == 'ltr') {
      x = startX + (colWidth + childrenGutter) * nextColumn
    } else {
      x = startX - (colWidth + childrenGutter) * nextColumn - colWidth
    }
    var y = this._columns[nextColumn]

    if (nextColumn === 2 && index < 3) {
      // console.log('colWidth:', colWidth)
      // console.log('childrenGutter:', childrenGutter)
      // console.log('nextColumn:', nextColumn)
      // console.log('x:', x)
      // console.log('y:', y)
    }

    children[index].style.transform =
      'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)'

    children[index].dataset.col = nextColumn

    this._columns[nextColumn] +=
      this._sizes[index] +
      (this._count > 1 ? this.conf.gutterY : this.conf.ultimateGutter) //margin-bottom
  }

  this._container.style.height =
    this._columns[this.getLongest()] - this._currentGutterY + 'px'
}

MiniMasonry.prototype.layoutCol = function (elem) {
  if (!this._container) {
    console.error('Container not found')
    return
  }
  this.reset()

  //Computing columns count
  if (this._count == null) {
    this._count = this.getCount()
  }
  // console.log('this._count:', this._count)

  //Computing columns width
  var colWidth = this.computeWidth()
  // console.log('colWidth:', colWidth)

  this._columns[0] = 0

  //Saving children real heights
  var children = this.getNextColumnSiblings(elem)
  var childCount = this._container.childElementCount
  // console.log('children:', children)

  for (var k = 0; k < children.length; k++) {
    // Set colWidth before retrieving element height if content is proportional
    children[k].style.width = colWidth + 'px'
    // this._sizes[k] = children[k].clientHeight
    this._colSizes[k] = children[k].clientHeight
  }
  // console.log('this._colSizes:', this._colSizes)

  var startX
  if (this.conf.direction == 'ltr') {
    startX = this.conf.surroundingGutter ? this._currentGutterX : 0
  } else {
    startX =
      this._width - (this.conf.surroundingGutter ? this._currentGutterX : 0)
  }

  if (this._count > childCount) {
    //If more columns than children
    var occupiedSpace =
      childCount * (colWidth + this._currentGutterX) - this._currentGutterX
    if (this.conf.wedge === false) {
      if (this.conf.direction == 'ltr') {
        startX = (this._width - occupiedSpace) / 2
      } else {
        startX = this._width - (this._width - occupiedSpace) / 2
      }
    } else {
      if (this.conf.direction == 'ltr');
      else {
        startX = this._width - this._currentGutterX
      }
    }
  }
  // console.log('startX:', startX)

  //Computing position of children
  for (var index = 0; index < children.length; index++) {
    var nextColumn = parseInt(elem.dataset.col)
    // var nextColumn = this.conf.minify
    //   ? this.getShortest()
    //   : this.getNextColumn(index)
    // console.log('nextColumn:', nextColumn)

    var childrenGutter = 0
    if (this.conf.surroundingGutter || nextColumn != this._count) {
      childrenGutter = this._currentGutterX
    }
    // console.log('childrenGutter:', childrenGutter)

    var x
    if (this.conf.direction == 'ltr') {
      x = startX + (colWidth + childrenGutter) * nextColumn
    } else {
      x = startX - (colWidth + childrenGutter) * nextColumn - colWidth
    }
    // console.log('x:', x)

    var y = this._columns[0]
    // console.log('y:', y)

    children[index].style.transform =
      'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)'

    this._columns[0] +=
      this._colSizes[index] +
      (this._count > 1 ? this.conf.gutterY : this.conf.ultimateGutter) //margin-bottom

    // console.log('this._columns:', this._columns)
  }

  // this._container.style.height =
  //   this._columns[this.getLongest()] - this._currentGutterY + 'px'
}

MiniMasonry.prototype.getNextColumnSiblings = function (elem) {
  // getting all sibling elements with same dataset col value
  let sibs = [elem]
  const col = parseInt(elem.dataset.col)

  while ((elem = elem.nextElementSibling)) {
    if (filter(elem, col)) sibs.push(elem)
  }

  return sibs
}

function filter(elem, col) {
  if (elem.dataset && parseInt(elem.dataset.col) === col) {
    return true
  } else return false
}

MiniMasonry.prototype.getNextColumn = function (index) {
  return index % this._columns.length
}

MiniMasonry.prototype.getShortest = function () {
  var shortest = 0
  for (var i = 0; i < this._count; i++) {
    if (this._columns[i] < this._columns[shortest]) {
      shortest = i
    }
  }

  return shortest
}

MiniMasonry.prototype.getLongest = function () {
  var longest = 0
  for (var i = 0; i < this._count; i++) {
    if (this._columns[i] > this._columns[longest]) {
      longest = i
    }
  }

  return longest
}

MiniMasonry.prototype.resizeThrottler = function () {
  // ignore resize events as long as an actualResizeHandler execution is in the queue
  if (!this._resizeTimeout) {
    this._resizeTimeout = setTimeout(
      function () {
        this._resizeTimeout = null
        //IOS Safari throw random resize event on scroll, call layout only if size has changed
        if (this._container.clientWidth != this._width) {
          this.layout()
        }
        // The actualResizeHandler will execute at a rate of 30fps
      }.bind(this),
      33
    )
  }
}

MiniMasonry.prototype.destroy = function () {
  if (typeof this._removeListener == 'function') {
    this._removeListener()
  }

  var children = this._container.children
  for (var k = 0; k < children.length; k++) {
    children[k].style.removeProperty('width')
    children[k].style.removeProperty('transform')
  }
  this._container.style.removeProperty('height')
  this._container.style.removeProperty('min-width')
}

export { MiniMasonry as default }
