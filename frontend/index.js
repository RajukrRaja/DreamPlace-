// Toggle the login modal visibility
function toggleLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
}

// Initialize tabs functionality on DOM content load
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.columns');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            contents.forEach(content => {
                if (content.id === tab.getAttribute('data-tab')) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });

    // Chatbot toggle functionality
    document.getElementById('chatbot-toggle').addEventListener('click', function() {
        const chatbotIframe = document.getElementById('chatbot-iframe');
        if (chatbotIframe.style.display === 'none' || chatbotIframe.style.display === '') {
            chatbotIframe.style.display = 'block';
            this.innerText = 'X';
        } else {
            chatbotIframe.style.display = 'none';
            this.innerText = 'Chat with us';
        }
    });

    // Toggle the navigation menu visibility
    document.getElementById('hamburger-menu').addEventListener('click', () => {
        const navLinks = document.getElementById('nav-links');
        navLinks.classList.toggle('show');
    });
});
$(document).ready(function(){
    $('.testimonial-carousel').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        arrows: true,
        dots: true,
        responsive: [
            {
                breakpoint: 992, // Tablet view
                settings: {
                    slidesToShow: 2,
                }
            },
            {
                breakpoint: 768, // Mobile view
                settings: {
                    slidesToShow: 1,
                }
            }
        ]
    });
});


