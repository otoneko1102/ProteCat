function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
  const pageHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

  window.scrollTo({ top: pageHeight, behavior: 'smooth' });
}

function createRandomCircle() {
    const circle = document.createElement("div");
    circle.className = "circle";

    const size = Math.floor(Math.random() * (80 - 30 + 1) + 30);
    circle.style.width = size + "px";
    circle.style.height = size + "px";

    const maxX = window.innerWidth - size;
    const maxY = window.innerHeight - size;

    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    circle.style.left = x + "px";
    circle.style.top = y + "px";

    document.getElementById("circle-container").appendChild(circle);
}

const minCircles = 30;
const maxCircles = 60;

const numCircles = Math.floor(Math.random() * (maxCircles - minCircles + 1) + minCircles);

for (let i = 0; i < numCircles; i++) {
    createRandomCircle();
}

document.addEventListener('DOMContentLoaded', function () {
    const menuButton = document.querySelector('.menu-button');
    const pageList = document.querySelector('.page-list');

    menuButton.addEventListener('click', function () {
        if (pageList.style.left === '-250px' || pageList.style.left === '') {
            pageList.style.left = '0';
        } else {
            pageList.style.left = '-250px';
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target !== menuButton && event.target !== pageList && !menuButton.contains(event.target) && !pageList.contains(event.target)) {
            pageList.style.left = '-250px';
        }
    });
});


