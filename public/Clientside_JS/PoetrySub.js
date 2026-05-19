import express from "express";
const PORT = 3000;



const app = express();


app.set("view engine", "ejs");
app.use(express.static("public"));



app.get("/", (req, res) => {
    res.render("PoetrySub.ejs");
});


// Select all slide and dot elements
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

// Track the current slide index
let currentIndex = 0;

// Function to show a specific slide
function showSlide(index) {
  // Hide all slides
  slides.forEach(slide => slide.classList.remove('active'));
  // Remove active class from all dots
  dots.forEach(dot => dot.classList.remove('active'));

  // Show the selected slide
  slides[index].classList.add('active');
  // Highlight the corresponding dot
  dots[index].classList.add('active');

  // Update the current index
  currentIndex = index;
}

// Add click event listeners to each dot
dots.forEach(dot => {
  dot.addEventListener('click', () => {
    const index = parseInt(dot.getAttribute('data-index'));
    showSlide(index); // Navigate to the clicked slide
  });
});

// Optional: Auto-slide every 5 seconds
setInterval(() => {
  let nextIndex = (currentIndex + 1) % slides.length;
  showSlide(nextIndex);
}, 10000);






app.get("", (req, res) => {
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));