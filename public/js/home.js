// function to rotate which li background image is being displayed
function changeIndex(obj, coffeeShops) {
  coffeeShops.forEach(
    (img, i) => (img.style.display = obj.num === i ? 'block' : 'none')
  );
  obj.num++;
  if (obj.num === coffeeShops.length) {
    obj.num = 0;
  }
}

function changeBg(t) {
  const coffeeShops = document.querySelectorAll('img');
  let obj = {};
  obj.num = 0;

  let timerId = setTimeout(function change() {
    changeIndex(obj, coffeeShops);
    timerId = setTimeout(change, t * 1000);
  }, t * 1000);
}

function loadPage() {
  const loader = document.querySelector('.loader-wrapper');

  document.addEventListener('readystatechange', event => {
    if (document.readyState === 'complete') {
      loader.remove();
      changeBg(3);
    }
  });
}

loadPage();
